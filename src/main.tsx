import 'cframe';

import './main.scss';

import React from 'react';
import { createRoot } from 'react-dom/client';

import LoremIpsum from './components/loremipsum';

const root = createRoot(document.getElementById('app_container'));
root.render(<LoremIpsum></LoremIpsum>);
