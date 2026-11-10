import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <SignUp
      appearance={{
        elements: {
          rootBox: "mx-auto shadow-md rounded-xl",
          card: "rounded-xl border border-slate-200 shadow-sm",
        },
      }}
    />
  );
}
