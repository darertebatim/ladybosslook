import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Globe } from "lucide-react";

const REGIONS = [
  { code: "IR", label: "🇮🇷 Iran" },
  { code: "AF", label: "🇦🇫 Afghanistan" },
  { code: "IQ", label: "🇮🇶 Iraq" },
];

type Row = {
  slug: string;
  title: string;
  is_active: boolean;
  restricted_regions: string[] | null;
  has_auto_enroll: boolean;
};

export default function RegionRestrictionsPanel() {
  const qc = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-region-restrictions"],
    queryFn: async (): Promise<Row[]> => {
      const [{ data: progs }, { data: autos }] = await Promise.all([
        supabase
          .from("program_catalog")
          .select("slug, title, is_active, restricted_regions")
          .order("title"),
        supabase.from("program_auto_enrollment").select("program_slug"),
      ]);
      const autoSet = new Set((autos || []).map((a: any) => a.program_slug));
      return (progs || []).map((p: any) => ({
        slug: p.slug,
        title: p.title,
        is_active: p.is_active,
        restricted_regions: p.restricted_regions || [],
        has_auto_enroll: autoSet.has(p.slug),
      }));
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ slug, next }: { slug: string; next: string[] }) => {
      const { error } = await supabase
        .from("program_catalog")
        .update({ restricted_regions: next })
        .eq("slug", slug);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-region-restrictions"] });
      toast.success("Region restrictions updated");
    },
    onError: (e: any) => toast.error(e?.message || "Update failed"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Region Restrictions
        </CardTitle>
        <CardDescription>
          Block enrollment per program for users whose device timezone matches these regions.
          Applies to both free and paid checkout, server-side.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Program</th>
                  {REGIONS.map((r) => (
                    <th key={r.code} className="py-2 px-2 font-medium text-center">
                      {r.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const current = row.restricted_regions || [];
                  return (
                    <tr key={row.slug} className="border-b last:border-0">
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{row.title}</span>
                          {!row.is_active && (
                            <Badge variant="outline" className="text-[10px]">inactive</Badge>
                          )}
                          {row.has_auto_enroll && (
                            <Badge variant="secondary" className="text-[10px]">auto-enroll</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{row.slug}</div>
                      </td>
                      {REGIONS.map((r) => {
                        const checked = current.includes(r.code);
                        return (
                          <td key={r.code} className="py-2 px-2 text-center">
                            <Checkbox
                              checked={checked}
                              disabled={toggle.isPending}
                              onCheckedChange={(v) => {
                                const next = v
                                  ? Array.from(new Set([...current, r.code]))
                                  : current.filter((x) => x !== r.code);
                                toggle.mutate({ slug: row.slug, next });
                              }}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}