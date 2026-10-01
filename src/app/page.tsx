import { Assistant } from "@/components/assistant";

export default async function Home({ searchParams }: PageProps<"/">) {
  const q = (await searchParams).q;
  return (
    <Assistant
      initialQuestion={typeof q === "string" ? q.slice(0, 500) : undefined}
    />
  );
}
