// https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/
// if [[ `lsappinfo info -only name \`lsappinfo front\`` =~ "iTerm2" || `lsappinfo info -only name \`lsappinfo front\`` =~ "Plex" ]]; then cliclick kd:cmd kp:tab ku:cmd; fi;

const fs = require('fs');
const path = require('path');


const manipulator = (opts, obj) => {
  if (!obj) {
    obj = opts;
    opts = undefined;
  }
  const excludeApps = !(opts && opts.global)
    // Don't need to exclude apps if we're already only including specific apps
    && !(obj.conditions && obj.conditions.find(c => c.type === 'frontmost_application_if'));
  return {
    type: 'basic',
    ...obj,
    conditions: [
      ...(obj.conditions || []),
      excludeApps && {
        bundle_identifiers: ['krunker'], type: 'frontmost_application_unless'
      },
    ].filter(x => x),
  };
};


const superShortcut = ({ k1, k2, out, special }) => [
  manipulator({
    description: `${k1} + ${k2} -> Super Shortcut`,
    from: {
      simultaneous: [{ key_code: k1 }, { key_code: k2 }],
      simultaneous_options: { key_down_order: 'insensitive' },
    },
    to: [{ key_code: out, modifiers: ['command', 'control', 'option', 'left_shift'] }],
    conditions: [
      special && {
        bundle_identifiers: Object.keys(special), type: 'frontmost_application_unless',
      },
    ].filter(x => x),
  }),
  ...(!special ? [] : Object.keys(special).map(sp => manipulator({
    description: `${k1} + ${k2} -> Super Shortcut (${sp})`,
    from: {
      simultaneous: [{ key_code: k1 }, { key_code: k2 }],
      simultaneous_options: { key_down_order: 'insensitive' },
    },
    conditions: [{
      bundle_identifiers: [sp], type: 'frontmost_application_if',
    }],
    ...special[sp],
  }))),
].filter(x => x);


const pickApp = ({ k, app, bundleId, inApp }) => [manipulator({
  description: `Semicolon + ${k} -> ${app}`,
  from: {
    simultaneous: [{ key_code: 'semicolon' }, { key_code: k }],
    simultaneous_options: { key_down_order: 'insensitive' },
  },
  conditions: (bundleId && inApp) ? [
    { bundle_identifiers: [bundleId], type: 'frontmost_application_unless' }
  ]: undefined,
  to: [{ shell_command: `open -a "${app}.app"` }],
}), ...((bundleId && inApp) ? [manipulator({
  description: `Semicolon + ${k} in ${app}`,
  from: {
    simultaneous: [{ key_code: 'semicolon' }, { key_code: k }],
    simultaneous_options: { key_down_order: 'insensitive' },
  },
  conditions: [{ bundle_identifiers: [bundleId], type: 'frontmost_application_if' }],
  to: inApp,
})] : [])];

const krunkerMap = (from, to) => manipulator({
  description: `Krunker: ${from} -> ${to}`,
  conditions: [{ bundle_identifiers: ['krunker'], type: 'frontmost_application_if' }],
  from: { key_code: from },
  to: [{ key_code: to }],
});


const manipulators = [
  manipulator({ global: true }, {
    description: 'Change caps_lock to control when used as modifier, escape when used alone',
    from: { key_code: 'caps_lock', modifiers: { optional: ['any'] } },
    to: [{ key_code: 'left_control' }],
    to_if_alone: [{ key_code: 'escape' }],
  }),

  manipulator({
    description: 'Cmd-J -> down',
    conditions: [{ bundle_identifiers: ['Emacs'], type: 'frontmost_application_unless' }],
    from: { key_code: 'j', modifiers: {mandatory: ['command'] } },
    to: { key_code: 'down_arrow', repeat: true },
  }),
  manipulator({
    description: 'Cmd-K -> up',
    conditions: [{ bundle_identifiers: ['Emacs'], type: 'frontmost_application_unless' }],
    from: { key_code: 'k', modifiers: { mandatory: ['command'] } },
    to: { key_code: 'up_arrow', repeat: true },
  }),
  manipulator({
    description: 'Cmd-H -> left',
    conditions: [{ bundle_identifiers: ['Emacs'], type: 'frontmost_application_unless' }],
    from: { key_code: 'h', modifiers: { mandatory: ['command'] } },
    to: { key_code: 'left_arrow', repeat: true },
  }),
  manipulator({
    description: 'Cmd-L -> up',
    conditions: [{ bundle_identifiers: ['Emacs'], type: 'frontmost_application_unless' }],
    from: { key_code: 'l', modifiers: { mandatory: ['command'] } },
    to: { key_code: 'right_arrow', repeat: true },
  }),
  manipulator({
    description: 'Cmd-Shift-J -> Cmd-J when important',
    conditions: [{ bundle_identifiers: ['firefox'], type: 'frontmost_application_if' }],
    from: { key_code: 'j', modifiers: { mandatory: ['command', 'shift'] } },
    to: { key_code: 'j', modifiers: ['command'] },
  }),
  manipulator({
    description: 'Cmd-Shift-K -> Cmd-K when important',
    conditions: [{ bundle_identifiers: ['firefox'], type: 'frontmost_application_if' }],
    from: { key_code: 'k', modifiers: { mandatory: ['command', 'shift'] } },
    to: { key_code: 'k', modifiers: ['command'] },
  }),

  manipulator({
    description: 'Alt-J -> Next tab',
    conditions: [{ bundle_identifiers: ['Emacs'], type: 'frontmost_application_unless' }],
    from: { key_code: 'j', modifiers: {mandatory: ['option'] } },
    to: { key_code: 'tab', modifiers: ['control'], repeat: true },
  }),
  manipulator({
    description: 'Alt-K -> Previous tab',
    conditions: [{ bundle_identifiers: ['Emacs'], type: 'frontmost_application_unless' }],
    from: { key_code: 'k', modifiers: {mandatory: ['option'] } },
    to: { key_code: 'tab', modifiers: ['control', 'shift'], repeat: true },
  }),


  manipulator({
    description: 'J + K -> escape',
    from: {
      simultaneous: [{ key_code: 'j' }, { key_code: 'k' }],
      simultaneous_options: {key_down_order: 'insensitive'},
    },
    to: [{ key_code: 'escape' }],
  }),
  manipulator({
    description: 'J + W -> Save (Cmd-S)',
    from: {
      simultaneous: [{ key_code: 'j' }, { key_code: 'w' }],
      simultaneous_options: { key_down_order: 'insensitive' },
    },
    to: [{ key_code: 's', modifiers: ['command'] }],
  }),
  ...superShortcut({ k1: 'j', k2: 'v', out: 'v' , special: {
    firefox: {
      to: [
        { key_code: 'l', modifiers: ['command'] },
        { key_code: '5', modifiers: ['shift'] },
      ],
    },
  }}),
  ...superShortcut({ k1: 'j', k2: 'x', out: 'x', special: {
    VSCode: {
      to: [{ key_code: 'p', modifiers: ['command', 'left_shift'] }],
    },
  }}),
  ...superShortcut({ k1: 'j', k2: 'd', out: 'd', special: {
    VSCode: {
      to: [{ key_code: 'p', modifiers: ['command'] }],
    },
    Postico: {
      to: [{ key_code: 'p', modifiers: ['command'] }],
    },
    firefox: {
      // Use J+D to select channels in Slack
      to: [{ key_code: 'k', modifiers: ['command'] }],
    },
  }}),
  ...superShortcut({ k1: 'j', k2: 'f', out: 'f', special: {
    firefox: {
      to: [{ key_code: 'l', modifiers: ['command'] }],
    },
  }}),
  ...superShortcut({ k1: 'j', k2: 'a', out: 'a', special: {
    VSCode: {
      to: [{ key_code: 'f', modifiers: ['command', 'shift'] }],
    }
  }}),
  ...superShortcut({ k1: 'j', k2: 'l', out: 'l', special: {
    VSCode: {
      to: [{ key_code: 'f12' }],
    },
    firefox: {
      // If the address bar is selected, reset it and re-select the browser content.
      to: [{ key_code: 'escape' }, { key_code: 'escape' }, { key_code: 'f6' }],
    },
    iterm: {
      to: [{ key_code: 'k', modifiers: ['command'] }],
    }
  }}),
  ...superShortcut({ k1: 'l', k2: 'semicolon', out: 'l', special: {
    VSCode: {
      to: [{ key_code: 'k', modifiers: ['command'] }, { key_code: 'i', modifiers: ['command'] }],
    },
  }}),
  ...superShortcut({ k1: 'j', k2: 'g', out: 'g' }),
  ...superShortcut({ k1: 'j', k2: 'semicolon', out: 'semicolon' }),
  ...superShortcut({ k1: 'j', k2: '1', out: '1' , special: {
    VSCode: {
      to: [{ key_code: 't', modifiers: ['command', 'option'] }],
    }
  }}),
  ...superShortcut({ k1: 'j', k2: '2', out: '2' }),
  ...superShortcut({ k1: 'j', k2: '3', out: '3' }),
  ...superShortcut({ k1: 'j', k2: '4', out: '4' }),

  ...superShortcut({ k1: 'k', k2: 'o', out: '0', special: {
    firefox: {
      to: [{ key_code: 'w', modifiers: ['command'] }],
    },
    VSCode: {
      to: [{ key_code: 'w', modifiers: ['command'] }],
    },
    iterm: {
      to: [{ key_code: 'w', modifiers: ['command'] }],
    },
  }}),
  manipulator({
    description: 'K + O + Q -> Cmd-Q',
    parameters: {
       'basic.simultaneous_threshold_milliseconds': 80,
    },
    from: {
      simultaneous: [{ key_code: 'k' }, { key_code: 'o' }, { key_code: 'q' }],
      simultaneous_options: { key_down_order: 'insensitive' },
    },
    to: [{ key_code: 'q', modifiers: ['command'] }],
  }),

  manipulator({
    description: 'FireFox Cmd+B Sidebar',
    from: { key_code: 'b', modifiers: {mandatory: ['command'] } },
    to: [{ key_code: 'f1' }],
    conditions: [{ bundle_identifiers: ['firefox'], type: 'frontmost_application_if' }],
  }),

  ...superShortcut({ k1: 'l', k2: 'semicolon', out: 'l'}),

  // manipulator({
  //   description: 'Moom bottom left',
  //   parameters: {
  //     // 'basic.simultaneous_threshold_milliseconds': 80,
  //   },
  //   from: {

  //     simultaneous: [{ key_code: 'spacebar' }, { key_code: 'm' }, { key_code: 'comma' }],
  //     simultaneous_options: { key_down_order: 'insensitive' },
  //   },
  //   to: [{ key_code: 'm', modifiers: ['command', 'control'] }],
  // }),
  // manipulator({
  //   description: 'Moom bottom right',
  //   parameters: {
  //     // 'basic.simultaneous_threshold_milliseconds': 80,
  //   },
  //   from: {
  //     simultaneous: [{ key_code: 'spacebar' }, { key_code: 'comma' }, { key_code: 'period' }],
  //     simultaneous_options: { key_down_order: 'insensitive' },
  //   },
  //   to: [{ key_code: 'slash', modifiers: ['command', 'control'] }],
  // }),
  // manipulator({
  //   description: 'Moom top left',
  //   parameters: {
  //     // 'basic.simultaneous_threshold_milliseconds': 80,
  //   },
  //   from: {
  //     simultaneous: [{ key_code: 'spacebar' }, { key_code: 'j' }, { key_code: 'k' }],
  //     simultaneous_options: { key_down_order: 'insensitive' },
  //   },
  //   to: [{ key_code: 'comma', modifiers: ['command', 'control'] }],
  // }),
  // manipulator({
  //   description: 'Moom top right',
  //   parameters: {
  //     // 'basic.simultaneous_threshold_milliseconds': 80,
  //   },
  //   from: {
  //     simultaneous: [{ key_code: 'spacebar' }, { key_code: 'k' }, { key_code: 'l' }],
  //     simultaneous_options: { key_down_order: 'insensitive' },
  //   },
  //   to: [{ key_code: 'period', modifiers: ['command', 'control'] }],
  // }),
  // manipulator({
  //   description: 'Moom left half',
  //   parameters: {
  //     // 'basic.simultaneous_threshold_milliseconds': 80,
  //   },
  //   from: {
  //     simultaneous: [{ key_code: 'spacebar' }, { key_code: 'j' }, { key_code: 'l' }],
  //     simultaneous_options: { key_down_order: 'insensitive' },
  //   },
  //   to: [{ key_code: 'j', modifiers: ['command', 'control'] }],
  // }),
  // manipulator({
  //   description: 'Moom right half',
  //   parameters: {
  //     // 'basic.simultaneous_threshold_milliseconds': 80,
  //   },
  //   from: {
  //     simultaneous: [{ key_code: 'spacebar' }, { key_code: 'm' }, { key_code: 'period' }],
  //     simultaneous_options: { key_down_order: 'insensitive' },
  //   },
  //   to: [{ key_code: 'k', modifiers: ['command', 'control'] }],
  // }),

  manipulator({ global: true }, {
    description: 'Semicolon + m -> Mute Google Meet in Chrome',
    from: {
      simultaneous: [{ key_code: 'semicolon' }, { key_code: 'm' }],
      simultaneous_options: { key_down_order: 'insensitive' },
    },
    to: [
      { shell_command: `open -a "Google Chrome.app"`, hold_down_milliseconds: 200 },
      { key_code: 'd', modifiers: ['command'] },
      { key_code: 'tab', modifiers: ['command'] },
    ],
  }),

  ...pickApp({ k: 'f', app: 'FireFox Developer Edition' }),
  ...pickApp({ k: 'e', app: '/System/Volumes/Data/usr/local/Cellar/emacs-plus@27/HEAD-29708cb/Emacs' }),
  // // ...pickApp({ k: 'e', app: 'Emacs' }),
  ...pickApp({ k: 'i', app: 'ITerm' }),
  ...pickApp({ k: 'v', app: 'Visual Studio Code', bundleId: 'VSCode', inApp: [
    { key_code: 'f6' },
  ]}),
  ...pickApp({ k: 'o', app: 'Postico' }),
  ...pickApp({ k: 'p', app: 'Plex' }),
  ...pickApp({ k: 'r', app: 'Finder' }),
  ...pickApp({ k: 's', app: 'Simulator' }),

  krunkerMap('a', 'left_shift'),
  krunkerMap('d', 's'),
  krunkerMap('delete_or_backspace', 'spacebar'),
  krunkerMap('e', 'w'),
  krunkerMap('f', 'd'),
  krunkerMap('r', 'e'),
  krunkerMap('s', 'a'),
  krunkerMap('t', 'r'),
  krunkerMap('u', 'r'),
  krunkerMap('w', 'q'),
  krunkerMap('q', 'tab'),
  krunkerMap('z', 'left_shift'),
];


const configPath = path.join(require('os').homedir(), '.config', 'karabiner', 'karabiner.json');
const config = require(configPath);
const profile = config.profiles.find(p => p.name === 'Default profile');

profile.complex_modifications = {
  parameters: {
    'basic.simultaneous_threshold_milliseconds': 35,

    'basic.to_delayed_action_delay_milliseconds': 500,
    'basic.to_if_alone_timeout_milliseconds': 200,
    'basic.to_if_held_down_threshold_milliseconds': 500,
    'mouse_motion_to_scroll.speed': 100,
  },
  rules: manipulators.map(m => ({ manipulators: [m] })),
};

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
