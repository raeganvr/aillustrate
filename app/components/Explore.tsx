"use client";
import React, { useEffect, useState, MouseEvent } from "react";
import Image from "next/image";

function NeuralNetworkDiagram() {
  const svgWidth = 700;       // wider SVG canvas
  const svgHeight = 350;      // taller SVG canvas for more vertical room
  
  const inputX = 50;         // move input farther left
  const hiddenX = 300;        // move hidden layer farther center
  const outputX = 650;        // move output farther right
  
  const hiddenCount = 12;
  const outputCount = 10;

  const evenlySpaced = (count: number, height: number) =>
    Array.from({ length: count }, (_, i) => (height / (count + 1)) * (i + 1));

  const hiddenY = evenlySpaced(hiddenCount, svgHeight);
  const outputY = evenlySpaced(outputCount, svgHeight);
  const inputY = svgHeight / 2;

  return (
    <div className="relative flex justify-center my-8">
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-3xl h-auto">
      <style jsx>{`
        .dim-line {
          stroke: #94a3b8;
          stroke-width: 0.7;
          opacity: 0.2;
        }

        .semi-glow-line {
          stroke: #38bdf8;
          stroke-width: 1.2;
          opacity: 0.7;
          filter: drop-shadow(0 0 2px #38bdf8);
        }

        .glow-line {
          stroke: #38bdf8;
          stroke-width: 2.2;
          filter: drop-shadow(0 0 4px #38bdf8);
        }

        .label {
          font-size: 14px;
          fill: white;
          text-anchor: middle;
          alignment-baseline: central;
          dominant-baseline: central;
        }
      `}</style>

        {/* Connection lines: input -> hidden */}
        {hiddenY.map((y, i) => (
          <line
            key={`input-hidden-${i}`}
            x1={inputX + 14}
            y1={inputY}
            x2={hiddenX - 14}
            y2={y}
            className={i % 3 === 1 ? "glow-line" : "dim-line"}
          />
        ))}

        {/* Connection lines: hidden -> output */}
        {hiddenY.flatMap((hy, i) =>
          outputY.map((oy, j) => {
            const isSourceNode = i === 1 || i === 4 || i === 7 || i === 10;
            const isGlowTarget = j === 0;
            const isSemiGlowTarget = j === 6 || j === 8 || j === 9;

            let className = "dim-line";
            if (isSourceNode && isGlowTarget) className = "glow-line";
            else if (isSourceNode && isSemiGlowTarget) className = "semi-glow-line";

            return (
              <line
                key={`hidden-output-${i}-${j}`}
                x1={hiddenX + 14}
                y1={hy}
                x2={outputX - 14}
                y2={oy}
                className={className}
              />
            );
          })
        )}

        {/* Input node */}
        <circle cx={inputX} cy={inputY} r={14} fill="#a855f7" />
        <text x={inputX} y={inputY} className="label">0</text>

        {/* Hidden layer */}
        {hiddenY.map((y, i) => (
          <circle key={`hidden-${i}`} cx={hiddenX} cy={y} r={12} fill="#60a5fa" />
        ))}

        {/* Output layer */}
        {outputY.map((y, i) => (
          <g key={`output-${i}`}>
            <circle cx={outputX} cy={y} r={12} fill="#CC5500" />
            <text x={outputX} y={y} className="label">{i}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}


// SideContents: a translucent side panel that fades in after you scroll past the first screen
function SideContents({
  sections,
}: {
  sections: { id: string; title: string }[];
}) {
  const [visible, setVisible] = useState(false);

  // Show the panel after scrolling 60% of window height
  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scrolling
  const handleClick = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      className={`
        fixed top-1/2 right-4 transform -translate-y-1/2 transition-opacity duration-700
        ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}
        bg-black/60 backdrop-blur-md p-4 rounded-lg z-10 shadow-lg
      `}
    >
      <h3 className="text-white text-sm mb-3 font-semibold uppercase tracking-wider">
        Quick Navigation
      </h3>
      <ul className="space-y-2">
        {sections.map(({ id, title }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              onClick={(e) => handleClick(e, id)}
              className="text-base text-gray-200 hover:text-white transition-colors"
            >
              {title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Main tutorial component
export default function Explore() {
  // The list of tutorial sections, matching your PDF headings:
  const sections = [
    {
      id: "intro-ai",
      title: "Introduction to Artificial Intelligence (AI)",
      content: (
        <>
          <p>
            Artificial Intelligence, or AI, is changing the way we live, communicate, and learn.
            You&apos;ve probably heard or even used AI in situations like chatting with ChatGPT,
            using virtual assistants like Siri or Alexa, or viewing personalized movie
            recommendations on Netflix. But what exactly is AI, and how does it work?
          </p>
        </>
      ),
    },
    {
      id: "from-ai-to-ml",
      title: "From AI to Machine Learning",
      content: (
        <>
          <p>
            Artificial Intelligence involves creating computer programs that can recognize
            patterns, make predictions, and perceivably behave intelligently, somewhat similar
            to how humans think. Humans are naturally skilled at tasks like recognizing faces,
            understanding speech, or reading handwriting. Traditionally, programming a
            computer to do these tasks meant writing out every single instruction explicitly,
            step-by-step.
          </p>
          <p>
            But let&apos;s take an example: Imagine teaching a computer to recognize handwritten
            numbers. Every person writes numbers differently, making it nearly impossible to
            manually program specific instructions to handle every style of handwriting.
          </p>
        </>
      ),
    },
    {
      id: "human-brain",
      title: "Enter Machine Learning",
      content: (
        <>
          <p>
            With Machine Learning, a specific type of AI, we teach computers to learn on
            their own by providing lots of examples. Let&apos;s say we want our AI to recognize
            handwritten numbers from 0 to 9.
          </p>
          <p>
            Traditionally, you&apos;d have to write a complex set of instructions describing exactly
            how each digit (0-9) should look, specifying the curves, points, angles, and strokes
            involved. Given how differently each person writes numbers, this becomes nearly
            impossible to program explicitly.
          </p>
          <p>
            Instead of programming every detail, we give our AI thousands of images of
            handwritten numbers, each labeled with the correct digit. Our AI examines these
            examples and learns subtle patterns by identifying common features like loops,
            curves, and straight lines, seemingly on its own.
          </p>
        </>
      ),
    },
    {
      id: "introducing-nn",
      title: "Thinking Like an AI",
      content: (
        <>
          <p>
            Let&apos;s imagine you are the AI. Right now, you have no idea what any digits look like,
            you just know there are ten possibilities: 0, 1, 2, 3, 4, 5, 6, 7, 8, or 9. Let us begin training.
          </p>
          <p>
            <strong>Round 1:</strong> Examine the image of a handwritten “0.” 
          </p>
          <Image 
            src="/photos/handwritten0.png" 
            alt="Hand Written 0" 
            width={100}
            height={100}
            className="mx-auto rounded-md shadow-md"
          /> 
          <p>
            Since you&apos;ve never
            seen a number before, you randomly guess one of the ten options, say, “1.” Immediately,
            you&apos;re told the guess was wrong, and that the correct answer is “0.” So, you start looking
            for a pattern. You notice the “0” has a loop with empty space in the middle.
          </p>
          <p>
            <strong>Round 2:</strong> 
          </p>
          <Image 
            src="/photos/handwritten0(1).png" 
            alt="Hand Written 0" 
            width={100}
            height={100}
            className="mx-auto rounded-md shadow-md"
          /> 
          <p>
            Examine a different handwritten “0.” This time, remembering
            the loop pattern you associated with “0,” you confidently say “0.” You&apos;re correct! You now
            reinforce your understanding that a loop likely indicates a “0.”
          </p>
          <p>
            <strong>Round 3:</strong> 
          </p>
          <Image 
            src="/photos/handwritten9.png" 
            alt="Hand Written 9" 
            width={100}
            height={100}
            className="mx-auto rounded-md shadow-md"
          />  
          <p>
            Examine an image of a handwritten “9.” You guess “0” again.
            You&apos;re told that it is actually a “9.” Surprised, you adjust your methodology: if you see a
            loop, it could be “0” or “9,” but a line attached to that loop makes it more likely a “9.”
          </p>
          <p>
            Now let&apos;s do that a thousand times, with a thousand different examples of digits. After
            seeing a hundred different “9”&apos;s, you get pretty good at recognizing it. The more unique
            handwriting you see, the better you are at identifying numbers that are written messy or
            with a different font.
          </p>
          <p>
            In reality, AI doesn&apos;t think exactly like humans do. Machines don&apos;t literally “see” or “think”
            about loops or lines in the casual way we do. Instead, their decision-making relies on
            mathematical patterns and numerical calculations. However, the fundamental idea remains
            simple: AI systems improve their predictions by analyzing many examples and learning from
            their mistakes and successes.
          </p>
        </>
      ),
    },
    {
      id: "anatomy-nn",
      title: "How a Neural Network Does It",
      content: (
        <>
          <p>
            In machine learning, these small discoveries and refinements happen inside something
            called a neural network. Imagine a neural network as a network of paths (called nodes
            and connections) that represent your thought processes.
          </p>
          <p>
            • <strong>Input Nodes:</strong> These are like your eyes, seeing the handwritten digits.<br />
            • <strong>Hidden Nodes:</strong> Think of these as your "thinking steps," detecting features
              like loops, curves, or straight lines.<br />
            • <strong>Output Nodes:</strong> These give your final answer—which digit(s) you think
              you&apos;ve recognized.
          </p>
          <p>
            Each node and connection represents a small rule or piece of evidence. For example,
            one hidden node might activate more if it detects a loop, another might activate if it
            sees a vertical line, and another might check if there&apos;s space within the loop. The
            combination of these activations leads the neural network to eventually prefer one digit
            more than the others.
          </p>

          <div className="grid grid-cols-3 gap-4 my-8 font-bold text-white">
            <div className="pl-7">Input</div>
            <div className="pl-3">Hidden Layer</div>
            <div className="text-right pr-8">Output</div>
          </div>
          <NeuralNetworkDiagram />
        </>
      ),
    },
    {
      id: "experimenting-nn",
      title: "Experimenting with Neural Networks: The Tool",
      content: (
        <>
          <p>
            Let&apos;s walk through using a real neural network. I will show you how to use the tool I made.
            Let&apos;s start by selecting a dataset. We can choose from the Boston Housing, California Housing,
            Diabetes Progression, and Iris classification datasets. For specific information, click the
            “Info” button next to the dropdown menu after choosing the dataset.
          </p>
          <Image 
            src="/photos/dataset.png" 
            alt="Dataset" 
            width={350}
            height={300}
            className="mx-auto rounded-md shadow-md"
          /> 
          <p>
            Next, let&apos;s discuss Test Size. Test size tells the neural network how much of this data we
            want to use for training (learning). This is key because it helps determine how well our
            model will perform on new, unseen data.
          </p>
          <Image 
            src="/photos/testsize.png" 
            alt="Test Size" 
            width={350}
            height={300}
            className="mx-auto rounded-md shadow-md"
          /> 
          <p>
            Now that we know our dataset and our testing/training separation, we can start building our
            input layer. Click on the input dropdown menu "Input Parameters." Here you can select inputs
            from the dataset that you wish to provide to your network for learning.
          </p>
          <Image 
            src="/photos/input.png" 
            alt="Inputs" 
            width={350}
            height={300}
            className="mx-auto rounded-md shadow-md" 
          /> 
          <p>
            The next part is Hidden Layers. Hidden layers are the intermediate layers between our input
            layer and the output layer. They allow the network to capture complex relationships in the
            data by breaking down the inputs into multiple, simpler steps.
          </p>
          <Image 
            src="/photos/train.png"  
            alt="Train Button" 
            width={350}
            height={300}
            className="mx-auto rounded-md shadow-md"
          /> 
          <p>
            Finally, we can press “Train Model.” Once finished, if we click on the “Loss Graph” header,
            we will see our loss epoch graph. Loss measures how far the neural network&apos;s predictions
            are from the actual values, and epochs are simply the number of times the model goes through
            the entire training dataset.
          </p>
          <Image 
            src="/photos/lossgraph.png" 
            alt="Loss Graph" 
            width={350}
            height={300}
            className="mx-auto rounded-md shadow-md"
          /> 
          <p>
            At the top of the sidebar, you will see the final Mean Absolute Error (MAE) percentage for
            regression datasets, or accuracy for classification datasets. By experimenting—changing
            inputs, adding or removing layers, or tweaking other settings—you discover how each choice
            impacts the neural network&apos;s ability to learn and predict accurately.
          </p>
          <Image 
            src="/photos/mae.png" 
            alt="MAE" 
            width={350}
            height={300}
            className="mx-auto rounded-md shadow-md"
          />  
          <p>
            By experimenting, changing inputs, adding or removing layers, or tweaking other settings, 
            you discover how each choice impacts the neural network&apos;s ability to learn and predict accurately.
          </p>
        </>
      ),
    },
  ];


  return (
    <div className="relative w-full min-h-screen bg-black text-white font-sans">
      <SideContents sections={sections.map(({ id, title }) => ({ id, title }))} />

      {/* Main content container */}
      <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24 space-y-16">
        {sections.map(({ id, title, content }) => (
          <section key={id} id={id} className="scroll-mt-24">
            <h2 className="text-3xl font-bold mb-4">{title}</h2>
            <div className="space-y-4 leading-relaxed text-gray-200">
              {content}
            </div>
          </section>
        ))}

        {/* CTA at bottom */}
        <div className="mt-16 text-center">
          <p className="pb-12 text-lg font-semibold text-white">
            Use the tool I created to explore a real working neural network!
          </p>
          <a
            href="/tool"
            className="px-16 py-4 border border-white rounded-full hover:bg-white hover:text-black transition-colors text-lg tracking-widest"
          >
            LAUNCH TOOL
          </a>
        </div>
      </div>
    </div>
  );
}
