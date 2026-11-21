import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageSkeleton } from "@/components/PageSkeleton";

const Home = lazy(() => import("@/pages/public/Home"));
const Features = lazy(() => import("@/pages/public/Features"));
const Solutions = lazy(() => import("@/pages/public/Solutions"));
const HowItWorks = lazy(() => import("@/pages/public/HowItWorks"));
const Pricing = lazy(() => import("@/pages/public/Pricing"));
const About = lazy(() => import("@/pages/public/About"));
const Contact = lazy(() => import("@/pages/public/Contact"));
const Auth = lazy(() => import("@/pages/public/Auth"));
const NotFound = lazy(() => import("@/pages/public/NotFound"));

const Dashboard = lazy(() => import("@/pages/app/Dashboard"));
const Properties = lazy(() => import("@/pages/app/Properties"));
const PropertyDetail = lazy(() => import("@/pages/app/PropertyDetail"));
const Requests = lazy(() => import("@/pages/app/Requests"));
const RequestNew = lazy(() => import("@/pages/app/RequestNew"));
const RequestDetail = lazy(() => import("@/pages/app/RequestDetail"));
const Classification = lazy(() => import("@/pages/app/Classification"));
const Duplicates = lazy(() => import("@/pages/app/Duplicates"));
const Recurring = lazy(() => import("@/pages/app/Recurring"));
const Briefs = lazy(() => import("@/pages/app/Briefs"));
const BriefEditor = lazy(() => import("@/pages/app/BriefEditor"));
const Contractors = lazy(() => import("@/pages/app/Contractors"));
const ContractorDetail = lazy(() => import("@/pages/app/ContractorDetail"));
const Reports = lazy(() => import("@/pages/app/Reports"));
const Settings = lazy(() => import("@/pages/app/Settings"));

function Loading() {
  return (
    <div className="p-8">
      <PageSkeleton />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="features" element={<Features />} />
          <Route path="solutions" element={<Solutions />} />
          <Route path="how-it-works" element={<HowItWorks />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
        </Route>
        <Route path="login" element={<Auth mode="login" />} />
        <Route path="register" element={<Auth mode="register" />} />
        <Route path="app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="properties" element={<Properties />} />
          <Route path="properties/:id" element={<PropertyDetail />} />
          <Route path="requests" element={<Requests />} />
          <Route path="requests/new" element={<RequestNew />} />
          <Route path="requests/:id" element={<RequestDetail />} />
          <Route path="classification" element={<Classification />} />
          <Route path="duplicates" element={<Duplicates />} />
          <Route path="recurring" element={<Recurring />} />
          <Route path="briefs" element={<Briefs />} />
          <Route path="briefs/:requestId" element={<BriefEditor />} />
          <Route path="contractors" element={<Contractors />} />
          <Route path="contractors/:id" element={<ContractorDetail />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
