# CinemaBook - Online Ticket Booking System

A modern, real-world online ticket booking system (like BookMyShow) built with React, featuring **hidden distributed systems concepts** running in the background for educational purposes.

## 🎬 Features

### User-Facing Features
- **Movie Discovery**: Browse current movies with ratings, showtimes, and pricing
- **Interactive Seat Selection**: Visual theater layout with real-time seat availability
- **Secure Payment Processing**: Card and UPI payment options with validation
- **Digital Tickets**: QR codes, downloadable tickets, and booking confirmations
- **User Authentication**: Login/Register with form validation
- **Responsive Design**: Mobile-first approach, works on all devices

### Hidden Distributed Systems (Background)
The following concepts run silently to ensure system reliability:
- **Berkeley Time Synchronization**: Keeps server clocks synchronized
- **RPC/RMI Simulation**: Remote procedure calls for booking operations
- **Data Replication**: Booking states replicated across multiple nodes
- **Mutual Exclusion**: Prevents double-booking using Ricart-Agrawala algorithm
- **Lamport Clocks**: Maintains event ordering for concurrent bookings

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:8080
```

## 🎨 Design Features
- Clean, modern UI with soft shadows and rounded corners
- Smooth hover animations and transitions
- Color-coded seat states (green=available, red=booked, yellow=selected)
- Professional cinema branding with blue/gold theme
- Mobile-responsive layout

## 🏗️ Architecture
- **React + TypeScript** for type-safe development
- **Tailwind CSS** with custom design system
- **Modular Components** for maintainability  
- **Background DS Manager** handles distributed systems operations
- **Toast Notifications** for user feedback

Built with modern web technologies for a production-ready booking experience.

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd distributed-systems-booking
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
   Navigate to `http://localhost:8080`

### Production Build
```bash
npm run build
npm run preview
```

## 🎮 How to Use

### Individual Simulations
1. Click on any simulation button (e.g., "Run Berkeley Sync")
2. Watch the real-time visualization in the UI
3. Monitor the event log panel for detailed execution steps
4. Observe seat grid changes and node status updates

### Complete Demonstration  
1. Click **"Run All Concepts"** for automatic sequential execution
2. Each simulation runs for 2-4 seconds with smooth transitions
3. Watch the comprehensive event log for educational insights

### Interactive Features
- **Seat Selection**: Click seats to simulate booking attempts
- **Node Monitoring**: Watch distributed node status in real-time
- **Algorithm Switching**: Toggle between different mutex algorithms
- **System Reset**: Clear all states and start fresh

## 📚 Educational Value

This simulation helps understand:
- **Clock Synchronization**: How distributed systems maintain time consistency
- **Remote Communication**: Service-to-service communication patterns  
- **Data Consistency**: How data stays synchronized across replicas
- **Concurrency Control**: Preventing race conditions in distributed systems
- **Event Ordering**: Maintaining causal relationships in distributed events

## 🎨 Design System

- **Primary Colors**: Modern blue/purple gradients
- **Interactive Elements**: Smooth hover effects and transitions
- **Card Layout**: Clean, shadowed cards for organized information
- **Responsive**: Mobile-first design approach
- **Accessibility**: Proper color contrast and keyboard navigation

## 🔧 Customization

The design system is fully customizable through:
- `src/index.css` - Design tokens and animations
- `tailwind.config.ts` - Color schemes and component variants
- Individual component files - Simulation parameters and timing

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by distributed systems textbooks and research papers
- Built with modern web technologies for educational accessibility
- Designed to make complex concepts visually understandable

---

**Built with ❤️ for distributed systems education**