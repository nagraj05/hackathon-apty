import { useEffect, useState } from "react";
import browser from "webextension-polyfill";


const BlockedAdsCount = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    browser.storage.local.get("blockedAdsCount", (data) => {
      setCount(data.blockedAdsCount || 0);
    });
  }, []);

  return (
    <div>
      <h2>Blocked Ads: {count}</h2>
    </div>
  );
};

export default BlockedAdsCount;