class LlmPrice < Formula
  desc "CLI to find cheapest LLM providers and discover cheaper similar models across 230+ providers"
  homepage "https://github.com/romankurnovskii/llm-price"
  version "1.0.0"
  url "https://registry.npmjs.org/llm-price/-/llm-price-1.0.0.tgz"
  sha256 "65ca77097179ce61b6ec56932356005bfa28ce6609d852f272d23b1e5d2554b6"
  license "MIT"

  depends_on "node"

  def install
    libexec.install Dir["*"]
    bin.install_symlink libexec/"dist/bin.js" => "llm-price"
  end

  test do
    assert_match "Usage: llm-price", shell_output("#{bin}/llm-price --help")
  end
end
