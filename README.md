# World Explorer - Interactive Travel Map

A modern, interactive web application for tracking your travel destinations across Europe and the world. Built with Next.js, TypeScript, and Leaflet for a seamless mapping experience.

## 🌍 Features

### Interactive Mapping
- **Click-to-Add**: Click anywhere on the map to add new destinations
- **Custom Markers**: Color-coded markers for different destination types
- **Real-time Updates**: Instant map updates when adding or editing destinations
- **Responsive Design**: Works perfectly on desktop and mobile devices

### Destination Management
- **Multiple Types**: Cities, landmarks, restaurants, hotels, museums, parks, and more
- **Rich Details**: Add notes, ratings, visit dates, and custom tags
- **Search & Filter**: Find destinations quickly with search and type filtering
- **Visit Tracking**: Mark destinations as visited with dates
- **Rating System**: Rate your experiences from 1-5 stars

### User Experience
- **Collapsible Sidebar**: Clean interface with toggleable destination list
- **Local Storage**: Your data persists between sessions
- **Modern UI**: Beautiful, intuitive interface with smooth animations
- **Keyboard Shortcuts**: Quick navigation and form submission

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd world-explorer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 How to Use

### Adding Destinations
1. **Click on the map** anywhere to add a new destination
2. **Enter the destination name** in the popup form
3. **Use the sidebar** to add destinations with full details
4. **Click the "+" button** in the sidebar for detailed forms

### Managing Destinations
- **Click markers** on the map to view destination details
- **Use the sidebar** to browse, search, and filter destinations
- **Edit destinations** by clicking the edit icon in destination cards
- **Delete destinations** with the trash icon (with confirmation)

### Destination Types
- 🏙️ **Cities**: Major cities and towns
- 🗽 **Landmarks**: Famous monuments and attractions
- 🍽️ **Restaurants**: Dining establishments
- 🏨 **Hotels**: Accommodation options
- 🏛️ **Museums**: Cultural institutions
- 🌳 **Parks**: Natural and recreational areas
- 📍 **Other**: Miscellaneous locations

### Features Overview
- **Search**: Find destinations by name or notes
- **Filter**: Show only specific destination types
- **Visit Tracking**: Mark destinations as visited with dates
- **Rating System**: Rate experiences from 1-5 stars
- **Tags**: Add custom tags for organization
- **Notes**: Add detailed notes about each destination

## 🛠️ Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Mapping**: Leaflet with React-Leaflet
- **Icons**: Lucide React
- **State Management**: React Hooks with localStorage

## 📁 Project Structure

```
world-explorer/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page component
├── components/            # React components
│   ├── Header.tsx         # Application header
│   ├── Sidebar.tsx        # Destination management sidebar
│   ├── MapComponent.tsx   # Interactive map component
│   ├── DestinationCard.tsx # Individual destination cards
│   └── DestinationForm.tsx # Add/edit destination form
├── types/                 # TypeScript type definitions
│   └── destination.ts     # Destination interface
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project documentation
```

## 🎨 Customization

### Styling
The application uses Tailwind CSS for styling. You can customize:
- Colors in `tailwind.config.js`
- Component styles in `app/globals.css`
- Individual component styles

### Map Configuration
- **Default Center**: Paris, France (48.8566, 2.3522)
- **Default Zoom**: Level 5
- **Tile Provider**: OpenStreetMap
- **Marker Colors**: Custom colors for each destination type

### Adding Features
- **New Destination Types**: Add to the type definition and update components
- **Additional Fields**: Extend the Destination interface
- **Custom Markers**: Modify the `createCustomIcon` function

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Key Components
- **MapComponent**: Handles all map interactions and rendering
- **Sidebar**: Manages destination list and forms
- **DestinationForm**: Comprehensive form for adding/editing destinations
- **DestinationCard**: Individual destination display in sidebar

## 🌟 Features in Detail

### Interactive Map
- **Click Events**: Add destinations by clicking on the map
- **Marker Popups**: View destination details in map popups
- **Custom Icons**: Color-coded markers based on destination type
- **Visit Status**: Visual indicators for visited vs unvisited destinations

### Data Persistence
- **Local Storage**: All data is saved to browser localStorage
- **Automatic Saving**: Changes are saved immediately
- **Data Recovery**: Data persists between browser sessions

### User Interface
- **Responsive Design**: Works on all screen sizes
- **Smooth Animations**: CSS transitions for better UX
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Modern Design**: Clean, professional appearance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Leaflet**: For the excellent mapping library
- **OpenStreetMap**: For providing free map tiles
- **Next.js**: For the amazing React framework
- **Tailwind CSS**: For the utility-first CSS framework

---

**Happy Traveling! 🌍✈️**
