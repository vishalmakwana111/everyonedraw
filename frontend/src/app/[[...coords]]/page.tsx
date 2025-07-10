import Canvas from "@/components/canvas/Canvas";
import ColorPalette from "@/components/ui/ColorPalette";

interface PageProps {
  params: {
    coords?: string[];
  };
}

export default function Home({ params }: PageProps) {
  const { coords } = params;
  const x = coords?.[0] ? parseInt(coords[0], 10) : 0;
  const y = coords?.[1] ? parseInt(coords[1], 10) : 0;
  const zoom = coords?.[2] ? parseFloat(coords[2]) : 1;

  return (
    <main>
      <Canvas initialOffset={{ x, y }} initialZoom={zoom} />
      <ColorPalette />
    </main>
  );
}
