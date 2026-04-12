import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PromoBannerManager } from '@/components/admin/PromoBannerManager';
import { SpecialBannersArchive } from '@/components/admin/SpecialBannersArchive';
import { BoxBannerManager } from '@/components/admin/BoxBannerManager';

export default function Banners() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Banners</h2>
        <p className="text-muted-foreground">Manage promo banners, box banners, and special in-app banners</p>
      </div>

      <Tabs defaultValue="promo">
        <TabsList>
          <TabsTrigger value="promo">Promo Banners</TabsTrigger>
          <TabsTrigger value="box">Box Banners</TabsTrigger>
          <TabsTrigger value="special">Special Banners</TabsTrigger>
        </TabsList>

        <TabsContent value="promo" className="space-y-6">
          <PromoBannerManager />
        </TabsContent>

        <TabsContent value="box" className="space-y-6">
          <BoxBannerManager />
        </TabsContent>

        <TabsContent value="special" className="space-y-6">
          <SpecialBannersArchive />
        </TabsContent>
      </Tabs>
    </div>
  );
}
