import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <SignIn
      appearance={{
        elements: {
          rootBox: "mx-auto shadow-md rounded-xl",
          card: "rounded-xl border border-slate-200 shadow-sm",
        },
      }}
    />
  );
}
