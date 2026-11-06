"use client";

import { FaClock } from "react-icons/fa";
import LastestChapters from "./new-updated-titles";

export default function NewUpdates() {
  return (
    <div>
      <div className="relative mb-3 flex items-center justify-between">
        <h1 className="my-0 flex items-center gap-3 text-[20px] text-web-title">
          <FaClock />
          <span>Truyện mới cập nhật</span>
        </h1>
      </div>
      <LastestChapters />
    </div>
  );
}
