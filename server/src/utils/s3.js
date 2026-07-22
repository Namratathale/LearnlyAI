import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Lazy initialization ensures process.env is fully loaded before AWS reads the keys
export const getS3Client = () => {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("AWS Credentials are not loaded in the environment.");
  }
  
  return new S3Client({
    region: process.env.AWS_REGION || "ap-south-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
  });
};

/**
 * Generates a temporary, secure URL for the client to upload directly to S3
 */
export const generateUploadURL = async (fileKey, fileType) => {
  const s3Client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME || "ap-south-1",
    Key: fileKey,
    ContentType: fileType,
  });
  
  return await getSignedUrl(s3Client, command, { expiresIn: 300 });
};

/**
 * Helper to convert an AWS S3 ReadableStream into a Buffer for pdf-parse
 */
export const streamToBuffer = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

