class LlmCheaper < Formula
  desc "CLI to find cheapest LLM providers and discover cheaper similar models across 230+ providers"
  homepage "https://github.com/romankurnovskii/llm-cheaper"
  version "1.0.0"
  url "https://registry.npmjs.org/llm-cheaper/-/llm-cheaper-1.0.0.tgz"
  sha256 "6e45728ebc85cd5889a154fd43facea21c307abb454932b6847160eae82fbb34"
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
