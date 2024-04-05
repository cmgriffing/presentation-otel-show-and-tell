export const dynamic = "force-dynamic"; // defaults to auto

export async function GET() {
  return new Response(
    JSON.stringify({
      foo: "bar",
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
