import type { ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import useMediaQuery from '@mui/material/useMediaQuery'

const drawerWidth = 260

const theme = createTheme({
  palette: {
    primary: { main: '#04843a' },
    background: { default: '#f6fbf7' },
    text: { primary: '#0f172a' }
  }
})

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/employees', label: 'Employees' },
  { to: '/distributors', label: 'Distributors' },
  { to: '/dealers', label: 'Dealers' },
  { to: '/products', label: 'Products' },
  { to: '/warehouse', label: 'Warehouse' },
  { to: '/orders', label: 'Orders' },
  { to: '/dispatch', label: 'Dispatch' },
  { to: '/invoices', label: 'Invoices' },
  { to: '/attendance', label: 'Attendance' },
  { to: '/expenses', label: 'Expenses' },
  { to: '/reports', label: 'Reports' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/settings', label: 'Settings' },
  { to: '/profile', label: 'Profile' },
]

export function Shell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const downLG = useMediaQuery((t: any) => t.breakpoints.down('lg'))

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <AppBar position="fixed" color="inherit" elevation={1} sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton component={Link} to="/" size="large" edge="start" color="primary">
                <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>CC</Avatar>
              </IconButton>
              <Box>
                <Typography variant="subtitle2">CCS Connect</Typography>
                <Typography variant="caption">Enterprise Partner ERP</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton color="inherit">
                <Avatar sx={{ width: 32, height: 32 }}>AS</Avatar>
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        <Drawer variant={downLG ? 'temporary' : 'permanent'} open sx={{ width: drawerWidth, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}>
          <Toolbar />
          <Box sx={{ overflow: 'auto', p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>CCS</Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {navItems.map((item) => (
                <ListItem key={item.to} disablePadding>
                  <ListItemButton component={NavLink} to={item.to} sx={{ borderRadius: 1 }}>
                    <ListItemIcon>
                      <Box sx={{ width: 10, height: 10, bgcolor: 'primary.main', borderRadius: '50%' }} />
                    </ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 1.5, sm: 3 }, width: { xs: '100%', lg: `calc(100% - ${drawerWidth}px)` } }}>
          <Toolbar />
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 600 }}>Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span style={{ color: '#475569' }}>{location.pathname === '/dashboard' ? 'Dashboard' : location.pathname.slice(1)}</span>
          </Box>
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  )
}
