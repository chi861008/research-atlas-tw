import { getChatGPTUser } from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  return (
    <main className="h-screen w-screen overflow-hidden bg-[#f5f6ef]">
      <iframe
        title="論證 Research Atlas"
        src={`/research-atlas.html${user ? "?signed_in=1" : ""}`}
        className="h-full w-full border-0"
        allow="clipboard-write"
      />
    </main>
  );
}
