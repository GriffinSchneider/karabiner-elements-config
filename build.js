// https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/
// Get bundle identifiers with `lsappinfo`


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
      // excludeApps && {
      //   bundle_identifiers: ['krunker'], type: 'frontmost_application_unless'
      // },
    ].filter(x => x),
  };
};


const superShortcut = ({ keys, out, special, deshift }) => [
  manipulator({
    description: `${keys.join(' + ')} -> Super Shortcut`,
    from: {
      simultaneous: keys.map(k => ({ key_code: k })),
      simultaneous_options: { key_down_order: 'insensitive' },
    },
    to: [{ key_code: out, modifiers: ['command', 'control', 'option', deshift ? null : 'left_shift'].filter(x => x) }],
    conditions: [
      special && {
        bundle_identifiers: Object.keys(special), type: 'frontmost_application_unless',
      },
    ].filter(x => x),
  }),
  ...(!special ? [] : Object.keys(special).map(sp => manipulator({
    description: `${keys.join(' + ')} -> Super Shortcut (${sp})`,
    from: {
      simultaneous: keys.map(k => ({ key_code: k })),
      simultaneous_options: { key_down_order: 'insensitive' },
    },
    conditions: [{
      bundle_identifiers: [sp], type: 'frontmost_application_if',
    }],
    ...special[sp],
  }))),
].filter(x => x);


const pickApp = ({ k, app, bundleId }) => [manipulator({
  description: `Semicolon + ${k} -> ${app}`,
  from: {
    simultaneous: [{ key_code: 'semicolon' }, { key_code: k }],
    simultaneous_options: { key_down_order: 'insensitive' },
  },
  conditions: [
    { bundle_identifiers: [bundleId], type: 'frontmost_application_unless' }
  ],
  to: [{ shell_command: `open -a "${app}.app"` }],
}), manipulator({
  description: `Semicolon + ${k} in ${app} -> Cmd+Tab`,
  from: {
    simultaneous: [{ key_code: 'semicolon' }, { key_code: k }],
    simultaneous_options: { key_down_order: 'insensitive' },
  },
  conditions: [{ bundle_identifiers: [bundleId], type: 'frontmost_application_if' }],
  to: [{ key_code: 'tab', modifiers: ['command'] }],
})];


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
    conditions: [{ bundle_identifiers: ['Emacs', 'VSCode'], type: 'frontmost_application_unless' }],
    from: { key_code: 'h', modifiers: { mandatory: ['command'] } },
    to: { key_code: 'left_arrow', repeat: true },
  }),
  manipulator({
    description: 'Cmd-L -> right',
    conditions: [{ bundle_identifiers: ['Emacs', 'VSCode'], type: 'frontmost_application_unless' }],
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
    description: 'Cmd-Alt-J -> Move tab forwards',
    conditions: [{ bundle_identifiers: ['Emacs'], type: 'frontmost_application_unless' }],
    from: { key_code: 'j', modifiers: {mandatory: ['command', 'option'] } },
    to: { key_code: 'page_down', modifiers: ['control', 'shift'], repeat: true },
  }),
  manipulator({
    description: 'Cmd-Alt-K -> Move tab backwards',
    conditions: [{ bundle_identifiers: ['Emacs'], type: 'frontmost_application_unless' }],
    from: { key_code: 'k', modifiers: {mandatory: ['command', 'option'] } },
    to: { key_code: 'page_up', modifiers: ['control', 'shift'], repeat: true },
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
  ...superShortcut({ keys: ['j', 'v'], out: 'v' , special: {
    firefox: {
      to: [
        { key_code: 'l', modifiers: ['command'] },
        { key_code: '5', modifiers: ['shift'] },
      ],
    },
  }}),
  ...superShortcut({ keys: ['j', 'x'], out: 'x', special: {
    VSCode: {
      to: [{ key_code: 'p', modifiers: ['command', 'left_shift'] }],
    },
    reaper: {
      to: [{ key_code: 'slash', modifiers: ['left_shift', 'option'] }],
    },
  }}),
  ...superShortcut({ keys: ['j', 'd'], out: 'd', special: {
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
  ...superShortcut({ keys: ['j', 'f'], out: 'f', special: {
    firefox: {
      to: [{ key_code: 'l', modifiers: ['command'] }],
    },
  }}),
  ...superShortcut({ keys: ['j', 'a'], out: 'a', special: {
    VSCode: {
      to: [{ key_code: 'f', modifiers: ['command', 'shift'] }],
    }
  }}),
  ...superShortcut({ keys: ['j', 'l'], out: 'l', special: {
    VSCode: {
      to: [{ key_code: 'f12' }],
    },
    firefox: {
      // If the address bar is selected, reset it and re-select the browser content.
      to: [{ key_code: 'escape' }, { key_code: 'escape' }, { key_code: 'f6' }],
    },
    iterm: {
      to: [{ key_code: 'k', modifiers: ['command'] }],
    },
    reaper: {
      to: [{ key_code: 'k', modifiers: ['command'] }],
    },
  }}),
  ...superShortcut({ keys: ['l', 'semicolon'], out: 'l', special: {
    VSCode: {
      to: [{ key_code: 'k', modifiers: ['command'] }, { key_code: 'i', modifiers: ['command'] }],
    },
  }}),
  ...superShortcut({ keys: ['j', 'g'], out: 'g' }),
  ...superShortcut({ keys: ['j', 'semicolon'], out: 'semicolon', special: {
    VSCode: {
      to: [{ key_code: 'f12', 'modifiers': ['left_shift'] }],
    },
  }}),
  ...superShortcut({ keys: ['j', '1'], out: '1' , special: {
    VSCode: {
      to: [{ key_code: 't', modifiers: ['command', 'option'] }],
    }
  }}),
  ...superShortcut({ keys: ['j', '2'], out: '2' }),
  ...superShortcut({ keys: ['j', '3'], out: '3' }),
  ...superShortcut({ keys: ['j', '4'], out: '4' }),

  ...superShortcut({ keys: ['k', 'o'], out: '0', special: {
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

  ...superShortcut({ keys: ['l', 'semicolon'], out: 'l'}),

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
      { shell_command: `open -a "Google Chrome.app"`, hold_down_milliseconds: 500 },
      { key_code: 'd', modifiers: ['command'] },
      { key_code: 'tab', modifiers: ['command'] },
    ],
  }),

  manipulator({
    description: 'h + ; -> VSCode go to route handler',
    from: {
      simultaneous: [{ key_code: 'h' }, { key_code: 'semicolon' }],
      simultaneous_options: { key_down_order: 'insensitive' },
    },
    to: [
      { key_code: 'v', modifiers: [] },
      { key_code: 'i', modifiers: [] },
      { key_code: 'quote', modifiers: [] },
      { key_code: 'c', modifiers: ['command'] },
      { shell_command: `/usr/local/bin/code --goto $(/usr/local/bin/ag -Q "registerRoute('$(pbpaste)" /Users/griffinschneider/dev/core | tr -d '\n' | cut -d ':' -f 1,2)` },
      // Alternate way in VSCode with a search editor:
      // { key_code: 'f', modifiers: ['command', 'option', 'control'] },
      // { key_code: 'o', modifiers: ['control'] },
      // { shell_command: `echo`, hold_down_milliseconds: 400 },
      // { key_code: 'escape' },
      // { key_code: 'i', modifiers: ['control'] },
      // { key_code: 'left_arrow', modifiers: [] },
      // { key_code: 'e', modifiers: [] },
      // { key_code: '9', modifiers: ['shift'] },
      // { key_code: 'quote', modifiers:  [] },
      // { key_code: 'return', modifiers: [] },
      // { shell_command: `echo`, hold_down_milliseconds: 500 },
      // { key_code: 'f4', modifiers: [], },
      // { key_code: 'f12', modifiers: [], },
      // { key_code: 'f', modifiers: ['command', 'option', 'control', 'shift'] },
      // { key_code: 'o', modifiers: ['control'] },
      // { key_code: 'f', modifiers: ['command', 'option', 'control', 'shift'] },
    ],
    conditions: [{ bundle_identifiers: ['VSCode'], type: 'frontmost_application_if' }],
  }),
  manipulator({
    description: 'h + ; + j -> VSCode go to route handler from clipboard',
    from: {
      simultaneous: [{ key_code: 'h' }, { key_code: 'semicolon' }, { key_code: 'j' }],
      simultaneous_options: { key_down_order: 'insensitive' },
    },
    to: [
      { shell_command: `/usr/local/bin/code --goto $(/usr/local/bin/ag -Q "registerRoute('$(pbpaste)" /Users/griffinschneider/dev/core | tr -d '\n' | cut -d ':' -f 1,2)` },
    ],
  }),

  manipulator({ global: true }, {
    description: 'Space + h + ; -> Open correlationId from clipboard in Honeycomb',
    from: {
      simultaneous: [{ key_code: 'semicolon' }, { key_code: 'h' }, { key_code: 'f'}],
      simultaneous_options: { key_down_order: 'insensitive' },
    },
    to: [{ shell_command: 'open http://ui.honeycomb.io/mable-test/datasets/prod-mable/trace?trace_id=$(pbpaste)'}],
  }),

  manipulator({ global: true }, {
    description: '[ + ] -> Move focus to the Menu Bar',
    from: {
      simultaneous: [{ key_code: 'open_bracket' }, { key_code: 'close_bracket' }],
      simultaneous_options: { key_down_order: 'insensitive' },
    },
    to: [{ key_code: 'f2', modifiers: ['control'] }],
  }),
  manipulator({ global: true }, {
    description: 'cmd + [ + ] -> Toggle status bar in VSCode',
    from: {
      simultaneous: [{ key_code: 'open_bracket' }, { key_code: 'close_bracket' }],
      simultaneous_options: { key_down_order: 'insensitive' },
      modifiers: { mandatory: ['command'] },
    },
    to: [{ key_code: 'close_bracket', modifiers: ['control', 'option', 'command'] }],
    conditions: [{ bundle_identifiers: ['VSCode'], type: 'frontmost_application_if' }],
  }),

  ...pickApp({ k: 'f', app: 'FireFox Developer Edition', bundleId: 'firefox' }),
  ...pickApp({ k: 'c', app: 'Google Chrome', bundleId: 'Chrome' }),
  // ...pickApp({ k: 'e', app: '/System/Volumes/Data/usr/local/Cellar/emacs-plus@27/HEAD-29708cb/Emacs', bundleId: 'Emacs' }),
  ...pickApp({ k: 'e', app: 'Emacs', bundleId: 'Emacs' }),
  ...pickApp({ k: 'i', app: 'ITerm', bundleId: 'iterm2' }),
  ...pickApp({ k: 'v', app: 'Visual Studio Code', bundleId: 'VSCode' }),
  ...pickApp({ k: 'o', app: 'Postico 2', bundleId: 'Postico' }),
  ...pickApp({ k: 'p', app: 'Plex', bundleId: 'tv.plex.desktop' }),
  ...pickApp({ k: 'r', app: 'Finder', bundleId: 'Finder' }),
  ...pickApp({ k: 's', app: 'Simulator', bundleId: 'iphonesimulator' }),
  ...pickApp({ k: 'a', app: 'REAPER-ARM', bundleId: 'reaper' }),
  ...pickApp({ k: 'q', app: 'Axe-Edit III', bundleId: 'AxeEdit' }),
  ...pickApp({ k: '1', app: '1Password 7', bundleId: 'onepassword7' }),
  ...pickApp({ k: 'g', app: 'Messages', bundleId: 'iChat' }),
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
