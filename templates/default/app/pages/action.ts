export async function action({ formData }: { formData: FormData }) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return {
      ok: false,
      message: "Please enter a name before submitting the demo form.",
    };
  }

  return {
    ok: true,
    message: `Saved a greeting for ${name}.`,
    submittedAt: new Date().toISOString(),
  };
}
