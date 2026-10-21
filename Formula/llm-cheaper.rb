class LlmCheaper < Formula
  desc "CLI to find cheapest LLM providers and discover cheaper similar models across 230+ providers"
  homepage "https://github.com/romankurnovskii/llm-cheaper"
  version "1.0.0"
  url "https://registry.npmjs.org/llm-cheaper/-/llm-cheaper-1.0.0.tgz"
  sha256 "7cd50049cd7a8eb27dd0e7845e3802fdb1748ce538c4862eeb3243e78b354b8a"
  license "MIT"

  depends_on "node"

  def install
    libexec.install Dir["*"]
    bin.install_symlink libexec/"dist/bin.js" => "llm-cheaper"
    bin.install_symlink libexec/"dist/bin.js" => "llm-price"
  end

  test do
    assert_match "Usage: llm-cheaper", shell_output("#{bin}/llm-cheaper --help")
  end
end
