import load from "./mdict-parser";

const dictionary = async (fileList) => {
  try {
    const resources = await load(fileList);
    return {
      lookup: async (query) => {
        try {
          const lookup = await (resources["mdx"] || resources["mdd"]);
          const definitions = lookup(query);
          return definitions.reduce((prev, txt) => prev + txt, "");
        } catch (error) {
          console.error(error);
        }
      },
      search: async ({ phrase = "", max = 10, follow = false } = {}) => {
        try {
          const lookup = await resources["mdx"];
          return lookup({
            phrase,
            max,
            follow,
          });
        } catch (error) {
          console.error(error);
        }
      },
    };
  } catch (error) {
    console.error(error);
  }
};

export default dictionary;
