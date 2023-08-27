import 'cframe';

import './main.scss';

import React from 'react';
import { createRoot } from 'react-dom/client';

import LoremIpsum from './components/loremipsum';

import foo from './foo';

const root = createRoot(document.getElementById('app_container'));
root.render(<LoremIpsum></LoremIpsum>);

foo('Completed');
