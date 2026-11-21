import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bot, Cloud, Database, FileText, HardDrive, KeyRound, Mail, MonitorDot, RotateCcw, ScanText, UserPlus, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/primitives";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlays";
import { PageHeader } from "@/components/shared";
import { useStore } from "@/data/store";
import { awsConfig, getAwsServices } from "@/services/config";
import { initials } from "@/lib/utils";
import { Fld } from "./Properties";

const ICONS: Record<string, typeof Cloud> = { bedrock: Bot, textract: ScanText, s3: HardDrive, dynamodb: Database, lambda: Zap, cognito: KeyRound, ses: Mail, cloudwatch: MonitorDot };

export default function Settings() {
  const store = useStore();
  const [resetOpen, setResetOpen] = useState(false);
  const services = getAwsServices();
  return (
    <>
      <PageHeader title="Settings & AWS architecture" description="Workspace, team, integrations and demo data." />
      <Tabs defaultValue="aws">
        <TabsList>
          <TabsTrigger value="aws">AWS integrations</TabsTrigger>
          <TabsTrigger value="team">Team & managers</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
        </TabsList>

        <TabsContent value="aws" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reference architecture</CardTitle>
              <CardDescription>How DwellMender runs on AWS. The demo uses simulated, in-browser equivalents of each service.</CardDescription>
            </CardHeader>
            <CardContent>
              <ArchitectureDiagram />
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {services.map((s) => {
              const Icon = ICONS[s.key] ?? Cloud;
              return (
                <Card key={s.key} className="p-4">
                  <div className="flex items-start justify-between">
                    <span className="grid h-9 w-9 place-items-center rounded-md bg-amber-50 text-amber-600"><Icon className="h-4 w-4" /></span>
                    <Badge variant={s.status === "Configured" ? "success" : s.status === "Simulated" ? "ai" : "secondary"}>{s.status}</Badge>
                  </div>
                  <div className="mt-3 font-semibold">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.purpose}</div>
                  <ul className="mt-2 space-y-0.5 text-xs text-navy-700">
                    {s.usedFor.map((u) => <li key={u}>• {u}</li>)}
                  </ul>
                </Card>
              );
            })}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Connection settings</CardTitle>
              <CardDescription>Set these as Vite environment variables (see <code>.env.example</code> and <code>docs/AWS_ARCHITECTURE.md</code>).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y rounded-lg border font-mono text-xs">
                {[
                  ["VITE_AWS_REGION", awsConfig.region],
                  ["VITE_API_BASE_URL", awsConfig.apiBaseUrl || "— not set (simulated mode)"],
                  ["VITE_COGNITO_USER_POOL_ID", awsConfig.cognitoUserPoolId || "— not set"],
                  ["VITE_COGNITO_CLIENT_ID", awsConfig.cognitoClientId || "— not set"],
                  ["VITE_S3_UPLOAD_BUCKET", awsConfig.uploadBucket || "— not set"],
                  ["VITE_USE_SIMULATED_AI", String(awsConfig.useSimulatedAI)],
                ].map(([k, v]) => (
                  <div key={k} className="grid gap-1 px-3 py-2 sm:grid-cols-[260px_1fr] sm:gap-3">
                    <span className="break-all text-navy-700">{k}</span>
                    <span className="break-all text-muted-foreground">{v}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <TeamTab />
        </TabsContent>

        <TabsContent value="workspace" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Your profile</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-4">
              <Avatar className="h-12 w-12"><AvatarFallback>{initials(store.user?.name ?? "")}</AvatarFallback></Avatar>
              <div className="text-sm">
                <div className="font-semibold">{store.user?.name}</div>
                <div className="text-muted-foreground">{store.user?.role} · {store.user?.organisation}</div>
                <div className="text-muted-foreground">{store.user?.email}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Demo data</CardTitle>
              <CardDescription>All data lives in your browser's local storage. Resetting restores the original six properties, {store.contractors.length} demo contractors and maintenance history.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3 text-sm">
              <Badge variant="secondary">{store.properties.length} properties</Badge>
              <Badge variant="secondary">{store.units.length} units</Badge>
              <Badge variant="secondary">{store.requests.length} requests</Badge>
              <Badge variant="secondary">{store.documents.length} documents</Badge>
              <Button variant="outline" className="ml-auto" onClick={() => setResetOpen(true)}><RotateCcw /> Reset demo data</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset demo data?</DialogTitle>
            <DialogDescription>Any properties, requests, decisions and briefs you've created in this browser will be replaced with the original demo dataset.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { store.resetDemo(); setResetOpen(false); toast.success("Demo data restored"); }}>Reset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const mSchema = z.object({ name: z.string().min(2, "Required"), email: z.string().email("Valid email required"), phone: z.string().min(6, "Required"), role: z.string().min(2, "Required") });

function TeamTab() {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof mSchema>>({ resolver: zodResolver(mSchema), defaultValues: { role: "Property Manager" } });
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Property managers</CardTitle>
          <CardDescription className="mt-1">Managers can be assigned to properties and receive notifications.</CardDescription>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}><UserPlus /> Add manager</Button>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="text-right">Properties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {store.managers.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-medium">{m.name}</TableCell>
              <TableCell>{m.role}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{m.email}<br />{m.phone}</TableCell>
              <TableCell className="text-right">{store.properties.filter((p) => p.managerId === m.id).map((p) => p.name).join(", ") || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add property manager</DialogTitle></DialogHeader>
          <form className="grid gap-3" onSubmit={handleSubmit((v) => { store.addManager(v); toast.success(`${v.name} added`); reset(); setOpen(false); })}>
            <Fld label="Full name" error={errors.name?.message}><Input {...register("name")} /></Fld>
            <Fld label="Role" error={errors.role?.message}><Input {...register("role")} /></Fld>
            <div className="grid grid-cols-2 gap-3">
              <Fld label="Email" error={errors.email?.message}><Input type="email" {...register("email")} /></Fld>
              <Fld label="Phone" error={errors.phone?.message}><Input {...register("phone")} /></Fld>
            </div>
            <DialogFooter><Button type="submit">Add manager</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ArchitectureDiagram() {
  const Box = ({ icon: Icon, title, sub, tone = "bg-white" }: { icon: typeof Cloud; title: string; sub: string; tone?: string }) => (
    <div className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 shadow-card ${tone}`}>
      <Icon className="h-4 w-4 shrink-0 text-amber-600" />
      <div className="min-w-0">
        <div className="text-xs font-semibold">{title}</div>
        <div className="truncate text-[11px] text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
  return (
    <div className="grid gap-4 rounded-xl bg-warm-100 p-4 lg:grid-cols-[1fr_auto_1.3fr_auto_1fr] lg:items-center">
      <div className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Clients</div>
        <Box icon={FileText} title="DwellMender web app" sub="React · Vite · CloudFront" />
        <Box icon={KeyRound} title="Amazon Cognito" sub="Sign-in, MFA, org scopes" />
      </div>
      <div className="hidden text-2xl text-muted-foreground lg:block">→</div>
      <div className="space-y-2 rounded-lg border-2 border-dashed border-amber-300 p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">API Gateway → AWS Lambda</div>
        <div className="grid grid-cols-2 gap-2">
          <Box icon={Zap} title="classify" sub="POST /ai/classify" />
          <Box icon={Zap} title="duplicates" sub="POST /ai/duplicates/scan" />
          <Box icon={Zap} title="briefs" sub="POST /ai/briefs" />
          <Box icon={Zap} title="documents" sub="S3 event → extract" />
          <Box icon={Zap} title="recurring" sub="EventBridge nightly" />
          <Box icon={Zap} title="notify" sub="DynamoDB stream → SES" />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Box icon={Bot} title="Amazon Bedrock" sub="Claude models" tone="bg-violet-50" />
          <Box icon={ScanText} title="Amazon Textract" sub="Forms & tables" tone="bg-violet-50" />
        </div>
      </div>
      <div className="hidden text-2xl text-muted-foreground lg:block">→</div>
      <div className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Data & ops</div>
        <Box icon={Database} title="Amazon DynamoDB" sub="Properties, requests, history" />
        <Box icon={HardDrive} title="Amazon S3" sub="Photos & documents" />
        <Box icon={Mail} title="Amazon SES" sub="Briefs & alerts" />
        <Box icon={MonitorDot} title="Amazon CloudWatch" sub="Metrics, logs, alarms" />
      </div>
    </div>
  );
}
