import { Card } from "@/components/ui/card";

export default function ChargementFiche() {
  return (
    <div className="space-y-5">
      <div className="h-4 w-48 rounded squelette" />
      <div className="h-8 w-56 rounded-control squelette" />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center gap-3 p-6">
            <div className="size-24 rounded-full squelette" />
            <div className="h-4 w-32 rounded squelette" />
            <div className="h-3 w-20 rounded squelette" />
          </div>
        </Card>
        <div className="space-y-5 lg:col-span-2">
          <Card className="h-40" />
          <Card className="h-40" />
        </div>
      </div>
    </div>
  );
}
