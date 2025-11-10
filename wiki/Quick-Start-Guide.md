# Quick Start Guide

Get started with ScriptScribbler in 5 minutes! This guide will take you from installation to writing your first screenplay.

## Step 1: Install & Setup (2 minutes)

### Prerequisites
- Node.js v18+ installed
- Firebase account
- Google Gemini API key (optional, for AI features)

### Quick Installation

```bash
# 1. Clone or download the repository
git clone https://github.com/Kiyoshiakira/ScriptScribblerFS.git
cd ScriptScribblerFS

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env .env.local

# 4. Edit .env.local with your keys
# Add your GEMINI_API_KEY and Firebase configuration

# 5. Start development server
npm run dev
```

**Access:** Open [http://localhost:9002](http://localhost:9002)

> 📖 **Need Help?** See detailed [Getting Started](Getting-Started) guide for environment variable setup.

---

## Step 2: Create Your Account (30 seconds)

### Sign Up

1. Click **"Sign Up"** on the login page
2. Choose method:
   - **Email/Password**: Enter email and create password
   - **Google**: Sign in with Google account (recommended)
3. Confirm your email if using email/password
4. You're in! 🎉

### What You'll See

After login, you'll see the **Dashboard** with:
- Welcome message
- "Create New Script" button
- Your scripts list (empty for now)

---

## Step 3: Create Your First Script (30 seconds)

### Create a Script

1. Click **"New Script"** or **"Create New Script"**
2. Enter script title (e.g., "My First Screenplay")
3. Click **"Create"**
4. Script opens in the **Editor** tab automatically

### First Look at the Editor

You'll see:
- **Left Sidebar**: Navigation tabs (Dashboard, Editor, Scenes, etc.)
- **Main Area**: Your screenplay editor
- **Top Header**: Script title and export/save buttons
- **Bottom Bar**: Word count and script statistics

---

## Step 4: Write Your First Scene (2 minutes)

### Start Writing

The editor uses **Fountain syntax** - but don't worry, it's easy!

#### Type This:

```
INT. COFFEE SHOP - DAY

Sarah sits at a corner table, typing on her laptop. The cafe is busy with the morning rush.

John enters, scanning the room for a seat.

JOHN
Excuse me, is this seat taken?

SARAH
(looking up)
No, please, go ahead.

John sits down and pulls out his laptop.

SARAH
(smiling)
Writer?

JOHN
(laughing)
That obvious? And you?

CUT TO:
```

#### What Happens:

- **Scene heading** automatically formatted: `INT. COFFEE SHOP - DAY`
- **Action** appears as regular text
- **Character names** in ALL CAPS
- **Dialogue** indented properly
- **Parentheticals** in (parentheses)
- **Transitions** right-aligned

### Quick Formatting Tips

| Type This | To Get This |
|-----------|-------------|
| `INT. LOCATION - DAY` | Scene heading |
| Regular text | Action/description |
| `CHARACTER` then dialogue | Character dialogue |
| `(smiling)` | Parenthetical |
| `CUT TO:` | Transition |
| Press `Tab` | Cycle element types |

> 📖 **Learn More:** See [Fountain Guide](Fountain-Guide) for complete syntax reference.

---

## Step 5: Explore Features (1 minute)

### Try These Tabs

Click tabs in the left sidebar:

#### 📊 Dashboard
- View all your scripts
- Create new projects
- See recent work

#### 🎬 Scenes
- See all your scenes listed
- Edit scene metadata
- Reorder scenes

#### 👥 Characters
- Characters auto-created from dialogue
- Add descriptions and portraits
- Track scene appearances

#### 📋 Notes
- Add production notes
- Organize research
- Keep ideas in one place

#### 📝 Logline
- Write your story summary
- Generate with AI (if enabled)

### Try AI Features (if enabled)

1. Click the **AI button** (bottom right)
2. Select an AI feature:
   - **AI Chat**: Ask questions about your script
   - **Suggest Improvements**: Get scene suggestions
   - **Proofread Script**: Check for errors
   - **Generate Logline**: Auto-create summary

> 📖 **Learn More:** See [AI Editor Features](AI-Editor-Features) for all AI capabilities.

---

## Common First-Time Questions

### How do I save my script?
**Auto-saves!** ScriptScribbler automatically saves your work every second after you stop typing. Just keep writing!

### Where did my character go?
Characters are automatically created when you write dialogue. Check the **Characters** tab to see all your characters.

### How do I format a scene heading?
Just type in ALL CAPS with `INT.` or `EXT.`:
```
INT. LOCATION - DAY
```
Press Enter, and it's formatted!

### How do I add a new scene?
Two ways:
1. Type a new scene heading in the editor
2. Click "Add Scene" button at bottom of editor

### Can I export my script?
Yes! Click **Export** in the top header and choose:
- PDF (for printing/sharing)
- Fountain (for other software)
- Final Draft (.fdx)
- Plain Text (.txt)
- `.scribbler` (native format, includes everything)

### How do I delete a character?
Go to **Characters** tab, click the menu (⋮) on character card, select "Delete". 

**Note:** Just removing dialogue doesn't delete the character - this prevents accidental data loss!

> 📖 **Learn More:** See [Character Management](Character-Management) for details.

---

## Keyboard Shortcuts to Remember

| Shortcut | Action |
|----------|--------|
| `Tab` | Cycle through element types |
| `Enter` | Create new element |
| `Shift + Enter` | Line break within element |
| `Backspace` (at start) | Merge with previous |
| `Ctrl/Cmd + S` | Manual save (auto-saves already) |
| `Ctrl/Cmd + F` | Find in script |

---

## Next Steps

### You're Ready to Write!

Now that you know the basics:

1. ✅ **Keep Writing**: Practice makes perfect
2. ✅ **Explore Features**: Try each tab and see what it does
3. ✅ **Use AI**: Experiment with AI suggestions
4. ✅ **Export**: Share your work in various formats
5. ✅ **Read Guides**: Dive deeper into specific features

### Recommended Reading

- **[Fountain Guide](Fountain-Guide)** - Master screenplay formatting
- **[Application Features](Application-Features)** - Discover all features
- **[Character Management](Character-Management)** - Understand the character system
- **[AI Editor Features](AI-Editor-Features)** - Leverage AI tools
- **[Export Functionality](Export-Functionality)** - Export in multiple formats

### Get Help

- **[Troubleshooting](Troubleshooting)** - Fix common issues
- **Browser Console** (F12) - See error messages
- **GitHub Issues** - Report bugs or request features

---

## Pro Tips for Beginners

### 💡 Tip 1: Focus on Writing First
Don't worry about perfect formatting initially. Write your story, then polish formatting later.

### 💡 Tip 2: Use Scene Blocks
Click the chevron to collapse scenes you're not working on. Keeps your editor clean!

### 💡 Tip 3: Let Characters Auto-Create
Write dialogue first, then fill in character details later in the Characters tab.

### 💡 Tip 4: Use AI for Tedious Work
Let AI handle proofreading and formatting, while you focus on storytelling.

### 💡 Tip 5: Export Often
Export to `.scribbler` regularly as backup. It saves everything!

### 💡 Tip 6: Organize with Notes
Use the Notes tab to track ideas, research, and plot points. Keep everything in one place!

---

## Quick Reference Card

### Scene Heading
```
INT. COFFEE SHOP - DAY
```

### Action
```
Sarah walks into the room and looks around.
```

### Dialogue
```
SARAH
Hello, how are you?
```

### Parenthetical
```
SARAH
(whispering)
Can you keep a secret?
```

### Transition
```
CUT TO:
```

### Centered Text
```
> THE END <
```

---

## You're All Set! 🎬

You now know enough to start writing your screenplay in ScriptScribbler.

**Remember:**
- Auto-save keeps your work safe
- Characters auto-create from dialogue
- AI can help when you're stuck
- Export anytime to share or backup
- Have fun writing!

---

**Happy Writing!** 🎭✍️

If you need more details on any feature, check out the other wiki pages linked throughout this guide.

---

**Related Pages:**
- [Getting Started](Getting-Started) - Detailed setup instructions
- [Application Features](Application-Features) - Complete feature overview
- [Fountain Guide](Fountain-Guide) - Comprehensive formatting guide
- [Troubleshooting](Troubleshooting) - Fix common issues
