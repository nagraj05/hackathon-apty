import { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "./components/ui/radio-group";
import { Label } from "./components/ui/label";
import { Switch } from "./components/ui/switch";

const App = () => {
  const [sites, setSites] = useState({});
  const [groups, setGroups] = useState({});
  const [globalNotes, setGlobalNotes] = useState([]);
  const [localNotes, setLocalNotes] = useState({});
  const [currentUrl, setCurrentUrl] = useState("");
  const [currentNote, setCurrentNote] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [noteType, setNoteType] = useState("global");
  
  const [adBlockEnabled, setAdBlockEnabled] = useState(true);
  const [blockedCount, setBlockedCount] = useState(0);
  const [blockingRules, setBlockingRules] = useState({
    images: true,
    popups: true,
    trackers: true,
    social: true
  });

  useEffect(() => {
    loadAllData();
    
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
    chrome.storage.local.get(["groupedTabs"], (result) => {
      if (result.groupedTabs) {
        setGroups(result.groupedTabs);
      }
    });

    chrome.storage.local.get(["sites"], (result) => {
      if (result.sites) {
        setSites(result.sites);
      }
    });

    chrome.storage.local.get(["globalNotes", "localNotes"], (result) => {
      setGlobalNotes(result.globalNotes || []);
      setLocalNotes(result.localNotes || {});
    });
    
    chrome.storage.local.get(["adBlockEnabled", "blockedCount", "blockingRules"], (result) => {
      setAdBlockEnabled(result.adBlockEnabled !== undefined ? result.adBlockEnabled : true);
      setBlockedCount(result.blockedCount || 0);
      setBlockingRules(result.blockingRules || {
        images: true,
        popups: true,
        trackers: true,
        social: true
      });
    });
  };

  const saveNote = () => {
    if (!currentNote.trim()) return;
    
    if (noteType === "global") {
      const updatedGlobalNotes = editIndex === null 
        ? [...globalNotes, currentNote]
        : globalNotes.map((note, i) => i === editIndex ? currentNote : note);
      
      setGlobalNotes(updatedGlobalNotes);
      chrome.storage.local.set({ globalNotes: updatedGlobalNotes });
    } else {
      const urlNotes = localNotes[currentUrl] || [];
      const updatedUrlNotes = editIndex === null
        ? [...urlNotes, currentNote]
        : urlNotes.map((note, i) => i === editIndex ? currentNote : note);
      
      const updatedLocalNotes = {
        ...localNotes,
        [currentUrl]: updatedUrlNotes
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
        [currentUrl]: urlNotes
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
  
  const toggleAdBlock = () => {
    const newState = !adBlockEnabled;
    setAdBlockEnabled(newState);
    chrome.storage.local.set({ adBlockEnabled: newState });
    chrome.runtime.sendMessage({ type: "TOGGLE_AD_BLOCK", enabled: newState });
  };
  
  const toggleBlockingRule = (rule) => {
    const updatedRules = {
      ...blockingRules,
      [rule]: !blockingRules[rule]
    };
    setBlockingRules(updatedRules);
    chrome.storage.local.set({ blockingRules: updatedRules });
    chrome.runtime.sendMessage({ type: "UPDATE_BLOCKING_RULES", rules: updatedRules });
  };
  
  const resetBlockedCount = () => {
    setBlockedCount(0);
    chrome.storage.local.set({ blockedCount: 0 });
  };

  const currentNotes = noteType === "global" 
    ? globalNotes 
    : (localNotes[currentUrl] || []);

  return (
    <div className="p-4 w-[400px]">
      <h2 className="text-xl font-bold mb-4">APTY Hackathon</h2>
      <Tabs defaultValue="tracker" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="tracker">Tracker</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="tabs">Tabs</TabsTrigger>
          <TabsTrigger value="adblock">AdBlock</TabsTrigger>
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
          <Button className="mt-2" onClick={() => {
            setSites({});
            chrome.storage.local.set({ sites: {} });
          }}>Reset Data</Button>
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
                <li key={index} className="border p-2 mt-2 rounded flex justify-between items-center">
                  <span className="text-sm">{note}</span>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => editNote(index)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteNote(index)}>Delete</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
        
        <TabsContent value="adblock">
          <h3 className="font-bold">Ad Blocker</h3>
          
          <div className="flex items-center justify-between mt-4">
            <Label htmlFor="ad-block-toggle" className="font-medium">
              Enable Ad Blocking
            </Label>
            <Switch 
              id="ad-block-toggle"
              checked={adBlockEnabled}
              onCheckedChange={toggleAdBlock}
            />
          </div>
          
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Blocking Rules</h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="block-images">Block Ad Images</Label>
                <Switch 
                  id="block-images"
                  checked={blockingRules.images}
                  onCheckedChange={() => toggleBlockingRule('images')}
                  disabled={!adBlockEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="block-popups">Block Popups</Label>
                <Switch 
                  id="block-popups"
                  checked={blockingRules.popups}
                  onCheckedChange={() => toggleBlockingRule('popups')}
                  disabled={!adBlockEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="block-trackers">Block Trackers</Label>
                <Switch 
                  id="block-trackers"
                  checked={blockingRules.trackers}
                  onCheckedChange={() => toggleBlockingRule('trackers')}
                  disabled={!adBlockEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="block-social">Block Social Media Widgets</Label>
                <Switch 
                  id="block-social"
                  checked={blockingRules.social}
                  onCheckedChange={() => toggleBlockingRule('social')}
                  disabled={!adBlockEnabled}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Ads Blocked</h4>
                <p className="text-2xl font-bold">{blockedCount}</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={resetBlockedCount}
              >
                Reset Counter
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default App;