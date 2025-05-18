import { faFolder } from "@fortawesome/pro-solid-svg-icons"
import { useEffect, useState } from "react";
import { Button } from "~/components/ui"

const testUrl = "https://api.fakeyou.com/v1/media_files/list/user/hanashi?include_user_uploads=true&page_size=24&filter_media_classes=unknown";

const getTestData = (callback: (data: any) => void) => {
  const netCall = async () => {
    // GET the test url
    const testResults = await fetch(testUrl);
    const testJson = await testResults.json();
    console.log("testResults", testJson);
    return testJson;
  }

  netCall().then(callback);
}

export const GalleryRootComponent = ({
  className
}: {
  className?: string
}) => {

  const [testData, setTestData] = useState<any>();

  useEffect(() => {
    getTestData(setTestData);
  }, [])

  const aggregatedData = aggregateGalleryData({ data: testData });

  return (
    <div className={className}>
      <div className="m-32">
        <div className="flex w-fit gap-x-6 items-center">
          <span className="text-white font-bold text-5xl">My Gallery</span>
          <Button variant="secondary" icon={faFolder} className="h-8">
            Open Folder
          </Button>
        </div>
        <div className="overflow-y-auto mt-12 flex flex-col gap-y-8">
          {Array.from(aggregatedData.entries()).map(([dateEpoch, results]) => (<GallerySection dateEpoch={dateEpoch} results={results} />))}
        </div>
      </div>
    </div>
  )
}

const GallerySection = ({
  dateEpoch,
  results
}: {
  dateEpoch: number,
  results: any[]
}) => {

  const dateObj = new Date(dateEpoch);
  const title = dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="w-full">
      <span className="text-lg">{title}</span>
      <div className="flex gap-4 flex-wrap mt-4">
        {results.map((result) => (<GalleryCard result={result} />))}
      </div>
    </div>
  )
}

const GalleryCard = ({ result }: {
  result: {
    media_links: {
      cdn_url: string,
      maybe_thumbnail_template: string,
    },
  }
}) => {
  return (
    <div className="rounded-md size-48 flex items-center justify-center overflow-hidden">
      <img src={result.media_links.cdn_url} alt="Thumbnail" className="h-full w-full object-cover" />
    </div>
  )
}

const aggregateGalleryData = ({
  data
}: {
  data?: {
    results: any[]
  }
}) => {
  const aggregateMap = new Map<number, any[]>();

  if (!data) {
    return aggregateMap;
  }

  data.results.forEach((result) => {
    if (result.media_type !== "image") {
        return;
    }
    
    const dateString = result.updated_at as string;
    const dateObj = new Date(dateString);

    // Move it the start of the day for comparison
    dateObj.setUTCHours(0, 0, 0, 0);

    const dateEpoch = dateObj.getTime();
    if (!aggregateMap.has(dateEpoch)) {
      aggregateMap.set(dateEpoch, []);
    }

    aggregateMap.get(dateEpoch)!.push(result);
  })

  return aggregateMap;
}
