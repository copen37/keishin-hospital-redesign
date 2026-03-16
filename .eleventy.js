module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets/images/original": "assets/images/original" });
  eleventyConfig.addPassthroughCopy({ "src/assets/js": "assets/js" });

  eleventyConfig.addFilter("isoDate", (value) => {
    if (!value) return "";
    const d = new Date(value);
    return d.toISOString().split("T")[0];
  });

  return {
    pathPrefix: "/keishin-hospital-redesign/",
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "dist"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
