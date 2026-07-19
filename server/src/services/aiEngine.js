import { generateStructuredContent } from '../utils/aiRouter.js';
import { Course } from '../models/Course.js';
/**
 * Splits raw text into an array of chunks (approx. 4,000 characters).
 */
export const chunkText = (rawText, chunkSize = 4000) => {
  const chunks = [];
  let currentChunk = '';
  const sentences = rawText.split(/(?<=[.?!])\s+/); 

  for (const sentence of sentences) {
    if ((currentChunk.length + sentence.length) > chunkSize) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence + ' ';
    } else {
      currentChunk += sentence + ' ';
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
};

/**
 * Generates the Course Skeleton using the Elite Instructional Designer Prompt
 */
export const generateCourseSkeleton = async (textChunks, originalFileName) => {
  
  const systemPrompt = `You are an elite instructional designer with deep expertise in 
curriculum architecture, cognitive scaffolding, and adult learning theory. You are 
given the full text of a document (split into indexed chunks) and must design a 
structured course that teaches this material in the most effective learning order.

CORE PRINCIPLES:
1. RESTRUCTURE, DON'T SUMMARIZE. The document's original order is often not the 
   best teaching order. If foundational concepts appear late in the document but 
   are prerequisites for earlier content, reorder them logically. Note: since 
   lessons reference sourceChunkRange, reordering is fine — the frontend maps 
   lessons back to source text regardless of course order.
2. NEVER HALLUCINATE. Every chapter, topic, and lesson must be traceable to actual 
   content in the provided chunks. Do not invent examples, facts, or subtopics not 
   present in the source. If the document lacks depth on a topic, keep the lesson 
   short rather than inventing content.
3. INFER DIFFICULTY HONESTLY. Base difficultyLevel on vocabulary complexity, 
   assumed prior knowledge, and density of technical jargon — not on subject 
   matter alone. A "beginner-friendly" explanation of quantum computing is still 
   Advanced if it assumes linear algebra fluency.
4. SIZE PROPORTIONALLY. Use this as a guide, not a rigid rule:
   - Short document (< 15 chunks): 2-4 chapters, 1-2 topics each, 2-4 lessons per topic
   - Medium document (15-40 chunks): 4-8 chapters, 2-4 topics each, 3-5 lessons per topic
   - Long document (40+ chunks): 8-15 chapters, scale topics/lessons accordingly
   Never create a chapter with only one lesson unless the document genuinely only 
   supports that. Never create a lesson from a single sentence of source material.
5. WRITE LIKE A TEACHER, NOT A LABEL-GENERATOR. Descriptions and objectives must be 
   specific to THIS document's actual content. Banned phrases: "This chapter covers 
   important concepts," "In this course you will learn about," "various aspects of." 
   Instead name the actual concepts, tools, or ideas involved.
6. HANDLE NON-INSTRUCTIONAL DOCUMENTS GRACEFULLY. If the document is not naturally 
   educational (e.g., a legal contract, a novel, a resume, meeting minutes), do not 
   force a fake course. Instead, design the best possible "understand this document" 
   course: e.g., for a contract, chapters might be organized around its major clauses 
   and what each obligates; for a novel, around narrative structure and themes. Set 
   difficultyLevel based on how much context a reader needs regardless of genre.
7. SOURCE GROUNDING. Every lesson MUST include a sourceChunkRange: [startIndex, 
   endIndex] (inclusive) indicating which chunks its content is drawn from. Prefer 
   tight, accurate ranges over broad ones — this is used downstream for RAG-grounded 
   content generation, so an overly wide range will pollute lesson content with 
   irrelevant material.

INTERNAL PROCESS (do this silently before producing output):
Step 1 — Skim all chunks and identify the document's actual topic map: what are the 
  real recurring themes, in what dependency order should they be taught?
Step 2 — Identify prerequisite knowledge the document assumes but doesn't explain — 
  these become "prerequisites."
Step 3 — Draft a chapter-level outline first, checking it covers the full chunk 
  range (0 to maxChunkIndex) with no major gaps or overlaps.
Step 4 — Break each chapter into topics, then lessons, assigning precise 
  sourceChunkRange values.
Step 5 — Self-check: Does every chunk index appear in at least one lesson's range? 
  Are any chapters too thin or too broad? Is difficultyLevel actually justified by 
  the vocabulary you saw? Revise before finalizing.

OUTPUT RULES:
- Output ONLY valid JSON matching the schema below. No markdown code fences, no 
  commentary, no text before or after the JSON.
- Escape all internal quotes properly. Do not include trailing commas.
- All string fields must be non-empty and specific to this document's content.

SCHEMA:
{
  "title": "string",
  "description": "string (2-3 sentences, specific to actual document content)",
  "estimatedTime": "string (e.g. '4 Hours', based on ~200 wpm reading + lesson density)",
  "difficultyLevel": "Beginner | Intermediate | Advanced",
  "learningObjectives": ["string", "... (4-6 items, action-verb phrased: 'Explain...', 'Apply...', 'Distinguish between...')"],
  "prerequisites": ["string", "... (empty array if genuinely none needed)"],
  "documentType": "textbook | technical_manual | research_paper | narrative | legal_document | business_document | other",
  "chapters": [
    {
      "title": "string",
      "description": "string (1-2 sentences, specific)",
      "topics": [
        {
          "title": "string",
          "lessons": [
            {
              "title": "string",
              "sourceChunkRange": [0, 0]
            }
          ]
        }
      ]
    }
  ]
}`;

  // We format the chunks strictly so the LLM clearly sees the index numbers
  // --- FIX: DYNAMIC TRUNCATION TO PROTECT GROQ'S 8K TOKEN LIMIT ---
  let formattedChunks = "";
  if (textChunks.length <= 10) {
    // If it's a short document, send the whole thing
    formattedChunks = textChunks.map((chunk, index) => `[CHUNK_INDEX: ${index}]\n${chunk}\n`).join('\n');
  } else {
    // If it's a large document, send the Head (first 7 chunks) and Tail (last 3 chunks)
    const head = textChunks.slice(0, 7).map((chunk, index) => `[CHUNK_INDEX: ${index}]\n${chunk}\n`).join('\n');
    const tail = textChunks.slice(-3).map((chunk, i) => {
      const actualIndex = textChunks.length - 3 + i; // Preserve the true index numbers
      return `[CHUNK_INDEX: ${actualIndex}]\n${chunk}\n`;
    }).join('\n');
    
    formattedChunks = `${head}\n\n... [MIDDLE CHUNKS OMITTED TO PREVENT MEMORY OVERLOAD] ...\n\n${tail}`;
  }

  const userPrompt = `
    Source Document Name: ${originalFileName}
    Total Available Text Chunks: ${textChunks.length} (Max Index: ${textChunks.length - 1})
    
    --- START DOCUMENT CONTENT ---
    ${formattedChunks}
    --- END DOCUMENT CONTENT ---
    
    Execute your internal process and output the JSON course skeleton.
  `;

  const skeletonJSON = await generateStructuredContent(systemPrompt, userPrompt);
  
  return { skeleton: skeletonJSON, chunks: textChunks };
};

/**
 * PHASE 4A: Generate Single Lesson Content
 * Uses the exact source chunks defined in the skeleton to prevent hallucinations.
 */
export const generateLessonContent = async (lessonTitle, sourceChunks) => {
  const systemPrompt = `
    You are an expert curriculum writer. You are writing a single lesson for a course.
    
    CRITICAL RULE: You must base your entire lesson ONLY on the provided Source Text. 
    Do not add external facts, historical dates, or examples unless they are explicitly 
    mentioned in the Source Text. If the source text is brief, make the lesson brief.

    OUTPUT SCHEMA (Must be valid JSON):
    {
      "explanation": "String (Clear, structured prose explaining the concept. Use markdown for bolding/italics).",
      "keyTakeaways": ["String", "String", "String"],
      "importantNotes": ["String (Warnings, caveats, or edge cases mentioned in the text)"],
      "realWorldExamples": ["String (Concrete examples mentioned in the text)"],
      "summary": "String (2-3 concluding sentences)"
    }
  `;

  // Join the relevant chunks together for this specific lesson
  const combinedSourceText = sourceChunks.join('\n\n');

  const userPrompt = `
    Lesson Title: ${lessonTitle}
    
    --- START SOURCE TEXT ---
    ${combinedSourceText}
    --- END SOURCE TEXT ---
    
    Generate the lesson content JSON.
  `;

  return await generateStructuredContent(systemPrompt, userPrompt);
};

/**
 * PHASE 4B: Parallel Processing Orchestrator
 * Processes an array of tasks concurrently, but enforces a maximum concurrency limit.
 */

const withTimeout = (promise, ms) => {
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error(`AI Request timed out after ${ms/1000}s`)), ms)
  );
  return Promise.race([promise, timeout]);
};

export const processLessonsInParallel = async (courseDoc, concurrencyLimit = 2) => {
  // 1. Extract pending lessons
  const pendingTasks = [];
  courseDoc.chapters.forEach((ch, chIdx) => {
    ch.topics.forEach((top, topIdx) => {
      top.lessons.forEach((les, lesIdx) => {
        if (les.generationStatus !== 'completed') {
          pendingTasks.push({ chIdx, topIdx, lesIdx, lessonId: les._id, title: les.title, chunkRange: les.sourceChunkRange });
        }
      });
    });
  });

  console.log(`[Engine] Starting generation for ${pendingTasks.length} lessons...`);

  // 2. Worker Factory
  const executeTask = async (task) => {
  try {
    console.log(`[Worker] Started: ${task.title}`);
    const sourceChunks = courseDoc.textChunks.slice(task.chunkRange[0], task.chunkRange[1] + 1);
    const content = await withTimeout(generateLessonContent(task.title, sourceChunks), 60000);
    
    // ATOMIC UPDATE: No need to save the whole doc. 
    // We update only this specific lesson field using dot notation.
    await Course.updateOne(
      { _id: courseDoc._id },
      {
        $set: {
          [`chapters.${task.chIdx}.topics.${task.topIdx}.lessons.${task.lesIdx}.explanation`]: content.explanation,
          [`chapters.${task.chIdx}.topics.${task.topIdx}.lessons.${task.lesIdx}.keyTakeaways`]: content.keyTakeaways,
          [`chapters.${task.chIdx}.topics.${task.topIdx}.lessons.${task.lesIdx}.importantNotes`]: content.importantNotes,
          [`chapters.${task.chIdx}.topics.${task.topIdx}.lessons.${task.lesIdx}.realWorldExamples`]: content.realWorldExamples,
          [`chapters.${task.chIdx}.topics.${task.topIdx}.lessons.${task.lesIdx}.summary`]: content.summary,
          [`chapters.${task.chIdx}.topics.${task.topIdx}.lessons.${task.lesIdx}.generationStatus`]: 'completed'
        }
      }
    );
    console.log(`[Worker] Success: ${task.title}`);
    return true;
  } catch (err) {
    console.error(`[Worker] Failed: ${task.title} - ${err.message}`);
    // Mark as failed atomically
    await Course.updateOne(
      { _id: courseDoc._id },
      { $set: { [`chapters.${task.chIdx}.topics.${task.topIdx}.lessons.${task.lesIdx}.generationStatus`]: 'failed' } }
    );
    return false;
  }
};

  // 3. Managed Concurrency Pool
  const executing = new Set();
  for (const task of pendingTasks) {
    const p = executeTask(task);
    executing.add(p);
    
    // Once task finishes, remove from pool
    p.then(() => executing.delete(p));
    
    // If pool is full, wait for one to finish
    if (executing.size >= concurrencyLimit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  console.log(`[Engine] Generation cycle finished.`);
};