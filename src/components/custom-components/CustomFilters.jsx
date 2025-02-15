// CustomFilters.js
import { useState } from "react";

const CustomFilters = () => {
  const [domain, setDomain] = useState("");

  const addDomain = () => {
    const blockedDomains = JSON.parse(localStorage.getItem("blockedDomains") || "[]");
    blockedDomains.push(domain);
    localStorage.setItem("blockedDomains", JSON.stringify(blockedDomains));
    setDomain("");
  };

  return (
    <div>
      <h2>Custom Filters</h2>
      <input
        type="text"
        placeholder="Enter domain to block"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
      />
      <button onClick={addDomain}>Add Domain</button>
    </div>
  );
};

export default CustomFilters;