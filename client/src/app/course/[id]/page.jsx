"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CoursePlayer from "@/components/CoursePlayer"; // Your component from the previous step
import API from "@/lib/api";

export default function CourseView() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);

  useEffect(() => {
    const fetchCourse = async () => {
      const { data } = await API.get(`/courses/${id}`);
      setCourse(data.data);
    };
    fetchCourse();
  }, [id]);

  if (!course) return <div className="flex h-screen items-center justify-center">Loading Course...</div>;

  return <CoursePlayer course={course} />;
}