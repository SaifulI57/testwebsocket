"use client";

import Image from "next/image";
import Footer from "@/components/footer";
import { useState, useEffect } from "react";
import { HtmlContext } from "next/dist/server/future/route-modules/app-page/vendored/contexts/entrypoints";

export default function Home() {
  const [file, setFilename] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState("");
  const preview = (
    <div>
      <p>{title}</p>

      <p>
        {description} {tag}
      </p>
    </div>
  );
  // Handler to update description based on large input value
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080/ws");

    socket.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      setFilename(msg.filename);
      setTitle(msg.title);
      setDescription(msg.description);
      setTag(msg.tag);
    };

    socket.onclose = () => {
      console.log("Disconnected from WebSocket server");
    };

    return () => {
      socket.close();
    };
  }, []);

  const handleTitleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };
  const handleDescriptionInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDescription(e.target.value);
  };
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let new_val = e.target.value.startsWith("#")
      ? e.target.value.replaceAll(" ", " #")
      : `#${e.target.value.replaceAll(" ", " #")}`;
    setTag(new_val);
  };
  return (
    <main className="grid w-full grid-rows-5 justify-items-center content-center h-full gap-4 min-h-screen">
      <div className="current row-start-1 grid content-center">
        <h2 className="text-center justify-center">Current Video: {file}</h2>
      </div>
      <div className="data grid gap-4 w-1/2 row-start-2 h-auto  ">
        <div className="py-2">
          <label
            htmlFor="preview"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Preview
          </label>
          <div className="border-2 bg-gray-200 text-black w-full h-1/2">
            {preview}
          </div>
        </div>
      </div>
      <div className="row-start-3 row-end-4 h-5/6">
        <form className="max-w-sm mx-auto">
          <div className="mb-5">
            <label
              htmlFor="title"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              className="block w-full p-4 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-base focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              onChange={handleTitleInputChange}
              value={title}
            />
            <label
              htmlFor="desc"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Description
            </label>
            <input
              type="text"
              id="desc"
              className="block w-full p-4 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-base focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              onChange={handleDescriptionInputChange}
              value={description}
            />
            <label
              htmlFor="tag"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Tag
            </label>
            <input
              type="text"
              id="tag"
              className="block w-full p-4 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-base focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              onChange={handleTagInputChange}
              value={tag}
            />
          </div>
        </form>
      </div>
      <Footer />
    </main>
  );
}
