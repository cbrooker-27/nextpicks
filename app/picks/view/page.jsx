"use client";
import { Suspense } from "react";
import View from "./view";
export default function Page() {
  return (
    <Suspense fallback={<div>Loading picks...</div>}>
      <View />
    </Suspense>
  );
}
