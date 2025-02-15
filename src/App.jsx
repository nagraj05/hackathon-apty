import { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";

const App = () => {
  const [sites, setSites] = useState({});
  const [groups, setGroups] = useState({});
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState("");
  const [editIndex, setEditIndex] = useState(null);

  useEffect(() => {
    chrome.storage.local.get(["groupedTabs"], (result) => {
      if (result.groupedTabs) {
        setGroups(result.groupedTabs);
      }
    });
  }, []);

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["sites"], (result) => {
        if (result.sites) {
          setSites(result.sites);
        }
      });
    }
  }, []);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_NOTES" }, (response) => {
      setNotes(response?.notes || []);
    });
  }, []);

  const saveNote = () => {
    if (!currentNote.trim()) return;
    chrome.runtime.sendMessage({
      type: "SAVE_NOTE",
      note: currentNote,
      index: editIndex,
    });
    if (editIndex === null) {
      setNotes([...notes, currentNote]);
    } else {
      const updatedNotes = [...notes];
      updatedNotes[editIndex] = currentNote;
      setNotes(updatedNotes);
    }
    setCurrentNote("");
    setEditIndex(null);
  };

  const deleteNote = (index) => {
    chrome.runtime.sendMessage({ type: "DELETE_NOTE", index });
    setNotes(notes.filter((_, i) => i !== index));
  };

  const editNote = (index) => {
    setCurrentNote(notes[index]);
    setEditIndex(index);
  };


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
          <Button className="mt-2" onClick={() => setSites({})}>Reset Data</Button>
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
            <Button onClick={() => chrome.runtime.sendMessage({ action: "saveSession" })}>Save</Button>
            <Button onClick={() => chrome.runtime.sendMessage({ action: "restoreSession" })}>Restore</Button>
          </div>
        </TabsContent>
        
        <TabsContent value="notes">
          <h3 className="font-bold">Smart Notes</h3>
          <textarea
            className="w-full h-20 border rounded mt-2"
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
          />
          <Button className="mt-2" onClick={saveNote}>
            {editIndex !== null ? "Update" : "Save"}
          </Button>
          <ul className="mt-4">
            {notes.map((note, index) => (
              <li key={index} className="border p-2 mt-2 rounded flex justify-between items-center">
                {note}
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => editNote(index)}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteNote(index)}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default App;
