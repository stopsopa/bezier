// to install go to: https://stopsopa.github.io//pages/bash/index.html#xx

// https://stopsopa.github.io/viewer.html?file=xx.cjs
// edit: https://github.com/stopsopa/stopsopa.github.io/blob/master/xx.cjs
const S = "\\\\";

module.exports = (setup) => {
  return {
    help: {
      command: `
set -e  
# git config core.excludesFile .git/.gitignore_local

echo -e "\n      Press enter to continue\n"
read

source .env
# source .env.sh
        
cat <<EEE

  🐙 GitHub: $(git ls-remote --get-url origin | awk '{\$1=\$1};1' | tr -d '\\n' | sed -E 's/git@github\\.com:([^/]+)\\/(.+)\\.git/https:\\/\\/github.com\\/\\1\\/\\2/g')

     🌎  HTTP Server is running http://\${HOST}:\${PORT}
     🔒  HTTPS Server is running https://\${HOST}:\${HTTPS_PORT}

EEE

      `,
      description: "Status of all things and help page",
      source: true,
      confirm: false,
    },
    [`refreshhttps`]: {
      command: `
set -e
/bin/bash refreshhttps.sh
`,
      confirm: false,
    },
    [`server`]: {
      command: `
set -e
# source .env
npm run start
`,
      confirm: false,
    },
    [`browser`]: {
      command: `
set -e
# source .env
cat <<EEE

    open "file://$(realpath "index.html")"

EEE

echo -e "\n      Press enter to continue\n"
read

open "file://$(realpath "index.html")"
`,
      confirm: false,
    },
    [`coverage`]: {
      command: `
set -e
source .env
cat <<EEE

    open "file://$(realpath "coverage/index.html")"

EEE

/bin/bash test.sh

echo -e "\n      Press enter to continue\n"
read

open "file://$(realpath "coverage/index.html")"
`,
      confirm: false,
    },
    ...setup,
  };
};
