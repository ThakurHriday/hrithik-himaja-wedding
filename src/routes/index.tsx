import { createFileRoute } from "@tanstack/react-router";
import { DeepotsavOpening } from "@/components/deepotsav/DeepotsavOpening";
import { LangProvider } from "@/components/wedding/i18n";
import { WeddingSections } from "@/components/wedding/Sections";
import { FloatingControls, ScrollCue } from "@/components/wedding/FloatingControls";
import { TopBar, Petals } from "@/components/wedding/TopBar";
import { DiyaScrollbar, NextPageLink, useStartAtOpening } from "@/components/wedding/ScrollAids";
import { useOpeningWatcher } from "@/components/wedding/opening-signals";
import shareImage from "@/assets/couple-red-lehenga.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hrithik & Himaja — The Royal Deepotsav Wedding" },
      {
        name: "description",
        content:
          "Hrithik Thakur & Himaja invite you to their wedding on 3 December 2026 at PBR Convention, Hyderabad — ceremonies, venue, dress code and more.",
      },
      { property: "og:title", content: "Hrithik & Himaja — The Royal Deepotsav Wedding" },
      { property: "og:description", content: "An invitation to celebrate love. 3 December 2026, 10:51 AM · PBR Convention, Hyderabad." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: shareImage },
      { name: "twitter:image", content: shareImage },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  useOpeningWatcher();
  useStartAtOpening();
  return (
    <LangProvider>
      <TopBar />
      <Petals />
      <main>
        <div className="relative">
          <DeepotsavOpening />
          <ScrollCue />
        </div>
        <WeddingSections />
        <FloatingControls />
        <NextPageLink />
      </main>
      <DiyaScrollbar />
    </LangProvider>
  );
}
