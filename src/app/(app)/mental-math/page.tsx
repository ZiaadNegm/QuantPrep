"use client";

import Link from "next/link";

export default function MentalMathPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold">Mental Math</h1>
      <p className="mb-8 text-gray-600">
        Choose a mode to start practicing mental arithmetic.
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        <Link
          href="/mental-math/practice"
          className="block rounded-lg border-2 border-gray-200 p-6 transition hover:border-blue-400 hover:shadow-md"
        >
          <h2 className="mb-2 text-xl font-semibold">Practice Mode</h2>
          <p className="mb-4 text-sm text-gray-600">
            Flexible training with customizable settings. Choose your levels,
            operations, and timing.
          </p>
          <p className="text-xs text-gray-500">
            Scoring: <span className="font-medium">+1</span> correct,{" "}
            <span className="font-medium">0</span> wrong,{" "}
            <span className="font-medium">0</span> skipped
          </p>
        </Link>

        <Link
          href="/mental-math/test"
          className="block rounded-lg border-2 border-gray-200 p-6 transition hover:border-blue-400 hover:shadow-md"
        >
          <h2 className="mb-2 text-xl font-semibold">Test Mode</h2>
          <p className="mb-4 text-sm text-gray-600">
            Timed tests simulating real quant interviews. Fixed presets with
            penalties for wrong answers.
          </p>
          <p className="text-xs text-gray-500">
            Scoring: <span className="font-medium">+1</span> correct,{" "}
            <span className="font-medium text-red-600">-1</span> wrong,{" "}
            <span className="font-medium">0</span> skipped
          </p>
        </Link>
      </div>
    </div>
  );
}
