import { NewsIndex as LibNewsIndex } from "@storyteller/markdown-content";
import Seo from "../../components/seo";

const NewsIndex = ({ basePath }: { basePath: string }) => {
  return (
    <>
      <Seo
        title="News & Updates - ArtCraft"
        description="Latest updates, features, and announcements from the ArtCraft team."
      />
      <LibNewsIndex basePath={basePath} />
    </>
  );
};

export default NewsIndex;
