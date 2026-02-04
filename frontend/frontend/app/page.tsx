"use client";
import { useEffect, useState } from "react";
export default function Home() {
  const [signals, setSignals] = useState([]);
  useEffect(() => {
    fetch("http://localhost:8000/signals")
      .then(res => res.json())
      .then(data => setSignals(data));
  }, []);
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Signalry</h1>
      <div className="mt-4">{signals.length} signals</div>
    </main>
  );
}
