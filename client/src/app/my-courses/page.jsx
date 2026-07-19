"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import API from "@/lib/api";
import { BookOpen, Clock, ChevronRight } from "lucide-react";

export default function MyLibrary() {
  const [courses, setCourses] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchCourses = async () => {
      const { data } = await API.get('/courses/my-courses');
      setCourses(data.data);
    };
    fetchCourses();
  }, []);

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">My Learning Library</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {courses.map(course => (
          <div key={course._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 text-blue-600">
              <BookOpen size={24} />
            </div>
            <h3 className="font-bold text-lg mb-2">{course.title}</h3>
            <p className="text-sm text-slate-500 mb-6">{course.description}</p>
            
            <button 
              onClick={() => router.push(`/course/${course._id}`)}
              className="w-full py-2 bg-slate-900 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-800"
            >
              Resume Learning <ChevronRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}