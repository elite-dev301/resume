"use client"
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'

function LocalizationProviderComponent({ children }: any) {

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      {children}
    </LocalizationProvider>
  )
}

export { LocalizationProviderComponent }