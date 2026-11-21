import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-warm-100 p-6 text-center">
      <div>
        <Logo />
        <h1 className="mt-8 text-5xl font-extrabold text-navy-900">404</h1>
        <p className="mt-2 text-navy-600">This page doesn't exist — unlike that leak in Flat 4B.</p>
        <Button className="mt-6" asChild>
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
