import { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "./components/ui/radio-group";
import { Label } from "./components/ui/label";

const App = () => {
  const [sites, setSites] = useState({});
  const [groups, setGroups] = useState({});
  const [globalNotes, setGlobalNotes] = useState([]);
  const [localNotes, setLocalNotes] = useState({});
  const [currentUrl, setCurrentUrl] = useState("");
  const [currentNote, setCurrentNote] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [noteType, setNoteType] = useState("global"); // "global" or "local"

  // Load all data on component mount
  useEffect(() => {
    loadAllData();

    // Get current URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        try {
          const url = new URL(tabs[0].url).hostname;
          setCurrentUrl(url);
        } catch (e) {
          console.error("Invalid URL:", tabs[0].url);
          setCurrentUrl("unknown");
        }
      }
    });
  }, []);

  const loadAllData = () => {
    // Load groups
    chrome.storage.local.get(["groupedTabs"], (result) => {
      if (result.groupedTabs) {
        setGroups(result.groupedTabs);
      }
    });

    // Load sites
    chrome.storage.local.get(["sites"], (result) => {
      if (result.sites) {
        setSites(result.sites);
      }
    });

    // Load notes - directly from storage
    chrome.storage.local.get(["globalNotes", "localNotes"], (result) => {
      setGlobalNotes(result.globalNotes || []);
      setLocalNotes(result.localNotes || {});
    });
  };

  const saveNote = () => {
    if (!currentNote.trim()) return;

    if (noteType === "global") {
      const updatedGlobalNotes =
        editIndex === null
          ? [...globalNotes, currentNote]
          : globalNotes.map((note, i) =>
              i === editIndex ? currentNote : note
            );

      setGlobalNotes(updatedGlobalNotes);
      chrome.storage.local.set({ globalNotes: updatedGlobalNotes });
    } else {
      // Local note
      const urlNotes = localNotes[currentUrl] || [];
      const updatedUrlNotes =
        editIndex === null
          ? [...urlNotes, currentNote]
          : urlNotes.map((note, i) => (i === editIndex ? currentNote : note));

      const updatedLocalNotes = {
        ...localNotes,
        [currentUrl]: updatedUrlNotes,
      };

      setLocalNotes(updatedLocalNotes);
      chrome.storage.local.set({ localNotes: updatedLocalNotes });
    }

    setCurrentNote("");
    setEditIndex(null);
  };

  const deleteNote = (index) => {
    if (noteType === "global") {
      const updatedGlobalNotes = globalNotes.filter((_, i) => i !== index);
      setGlobalNotes(updatedGlobalNotes);
      chrome.storage.local.set({ globalNotes: updatedGlobalNotes });
    } else {
      const urlNotes = [...(localNotes[currentUrl] || [])];
      urlNotes.splice(index, 1);

      const updatedLocalNotes = {
        ...localNotes,
        [currentUrl]: urlNotes,
      };

      setLocalNotes(updatedLocalNotes);
      chrome.storage.local.set({ localNotes: updatedLocalNotes });
    }
  };

  const editNote = (index) => {
    if (noteType === "global") {
      setCurrentNote(globalNotes[index]);
    } else {
      const urlNotes = localNotes[currentUrl] || [];
      setCurrentNote(urlNotes[index]);
    }
    setEditIndex(index);
  };

  // Get current notes based on type
  const currentNotes =
    noteType === "global" ? globalNotes : localNotes[currentUrl] || [];

  return (
    <div className="p-4 w-72">
      <h2 className="text-xl font-bold mb-4">APTY Hackathon</h2>
      <Tabs defaultValue="tracker" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="tracker">Tracker</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="tabs">Tabs</TabsTrigger>
        </TabsList>

        <TabsContent value="tracker">
          <h3 className="font-bold">Productivity Tracker</h3>
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
          <Button
            className="mt-2"
            onClick={() => {
              setSites({});
              chrome.storage.local.set({ sites: {} });
            }}
          >
            Reset Data
          </Button>
        </TabsContent>

        <TabsContent value="tabs">
          <h3 className="font-bold">Tab Manager</h3>
          {Object.entries(groups).map(([category, tabs]) => (
            <div key={category}>
              <h4 className="mt-2 font-semibold">{category}</h4>
              <ul className="list-disc ml-4">
                {tabs.map((tab, index) => (
                  <li key={index}>{tab.title}</li>
                ))}
              </ul>
            </div>
          ))}
          <div className="flex gap-2 mt-3">
            <Button
              onClick={() =>
                chrome.runtime.sendMessage({ action: "saveSession" })
              }
            >
              Save
            </Button>
            <Button
              onClick={() =>
                chrome.runtime.sendMessage({ action: "restoreSession" })
              }
            >
              Restore
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="notes">
          <h3 className="font-bold">Smart Notes</h3>

          <RadioGroup
            value={noteType}
            onValueChange={setNoteType}
            className="flex mt-2 mb-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="global" id="global" />
              <Label htmlFor="global">Global</Label>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <RadioGroupItem value="local" id="local" />
              <Label htmlFor="local">Local ({currentUrl})</Label>
            </div>
          </RadioGroup>

          <textarea
            className="w-full h-20 border rounded mt-2 p-2"
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
            placeholder={`Add a ${noteType} note...`}
          />
          <Button className="mt-2" onClick={saveNote}>
            {editIndex !== null ? "Update" : "Save"}
          </Button>

          <h4 className="mt-4 font-semibold">
            {noteType === "global" ? "Global Notes" : `Notes for ${currentUrl}`}
          </h4>

          {currentNotes.length === 0 ? (
            <p className="text-sm text-gray-500 mt-2">
              No {noteType} notes yet. Add one above!
            </p>
          ) : (
            <ul className="mt-2">
              {currentNotes.map((note, index) => (
                <li
                  key={index}
                  className="border p-2 mt-2 rounded flex justify-between items-center"
                >
                  <span className="text-sm">{note}</span>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => editNote(index)}>
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteNote(index)}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default App;
