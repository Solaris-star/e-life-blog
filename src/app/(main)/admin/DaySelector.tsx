"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function DaySelector({ days, selectedDay }: { days: string[]; selectedDay: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set("analyticsDay", e.target.value);
    } else {
      params.delete("analyticsDay");
    }
    const query = params.toString();
    router.push(`/admin${query ? `?${query}` : ""}#analytics`);
  };

  return (
    <select
      className="admin-input"
      value={selectedDay ?? ""}
      onChange={handleChange}
      aria-label="选择日期"
      disabled={days.length === 0}
    >
      {days.length === 0 ? (
        <option value="">暂无日期</option>
      ) : (
        days.map((day) => (
          <option key={day} value={day}>
            {day}
          </option>
        ))
      )}
    </select>
  );
}
