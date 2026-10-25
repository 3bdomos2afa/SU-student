import { createContext, useContext } from 'react';
// Until bundled fonts have actually loaded, Text/TextInput use platform defaults.
export const FontReadyContext = createContext(false);
export function useCustomFontsReady() { return useContext(FontReadyContext); }