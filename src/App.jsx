import { useEffect, useState } from "react";

const App = () => {
  const [sites, setSites] = useState({});
  const [groups, setGroups] = useState({});

  useEffect(() => {
    chrome.storage.local.get(["groupedTabs"], (result) => {
      if (result.groupedTabs) {
        setGroups(result.groupedTabs);
      }
    });
  }, []);

  const saveSession = () => {
    chrome.runtime.sendMessage({ action: "saveSession" });
  };

  const restoreSession = () => {
    chrome.runtime.sendMessage({ action: "restoreSession" });
  };

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["sites"], (result) => {
        if (result.sites) {
          setSites(result.sites);
        }
      });
    }
  }, []);

  const resetData = () => {
    setSites({});
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ sites: {} });
    }
  };

  return (
    <div className="p-4 w-64">
      <h2 className="text-lg font-bold">APTY Hackathon</h2>
      <div className="mt-3">
        <h3>Productivity Tracker</h3>
        <table className="mt-2 w-full border">
          <thead>
            <tr>
              <th className="border p-2">Website</th>
              <th className="border p-2">Time (min)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(sites).map(([site, time]) => (
              <tr key={site}>
                <td className="border p-2">{site}</td>
                <td className="border p-2">{(time / 60000).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
          onClick={resetData}
        >
          Reset Data
        </button>

        <div className="mt-4">
          <h2 className="text-lg font-bold">Tab Manager</h2>
          {Object.entries(groups).map(([category, tabs]) => (
            <div key={category}>
              <h3 className="font-bold mt-2">{category}</h3>
              <ul className="list-disc ml-4">
                {tabs.map((tab, index) => (
                  <li key={index}>{tab.title}</li>
                ))}
              </ul>
            </div>
          ))}
          <button
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
            onClick={saveSession}
          >
            Save
          </button>
          <button
            className="mt-2 bg-green-500 text-white px-4 py-2 rounded"
            onClick={restoreSession}
          >
            Restore
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
