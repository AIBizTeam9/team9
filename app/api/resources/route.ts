import { NextRequest, NextResponse } from "next/server";
import { RESOURCE_LIBRARY } from "@/lib/nextstep/resource-library";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const keyword = searchParams.get("keyword");

  let results = RESOURCE_LIBRARY;

  if (category) {
    results = results.filter((r) => r.category === category);
  }

  if (keyword) {
    const kw = keyword.toLowerCase();
    results = results.filter(
      (r) =>
        r.title.toLowerCase().includes(kw) ||
        r.description.toLowerCase().includes(kw) ||
        r.tags.some((t) => t.toLowerCase().includes(kw)),
    );
  }

  return NextResponse.json({ resources: results, total: results.length });
}
