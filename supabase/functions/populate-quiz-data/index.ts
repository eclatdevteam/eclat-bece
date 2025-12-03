import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // ============ AUTHENTICATION CHECK ============
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Create a client with the user's auth to verify their identity
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.log('Failed to get user:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Check if user is an admin using the is_admin function
    const { data: isAdmin, error: adminCheckError } = await userClient.rpc('is_admin', { _user_id: user.id });
    if (adminCheckError) {
      console.log('Failed to check admin status:', adminCheckError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to verify admin status' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!isAdmin) {
      console.log('User is not an admin:', user.id);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    console.log('Admin authenticated:', user.id);
    // ============ END AUTHENTICATION CHECK ============

    // Use service role client for database operations (bypasses RLS for admin operations)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('Populating quiz data...');

    // YEAR 6 QUESTIONS (Age 10-11) - Simpler, foundational concepts
    const year6Questions = [
      // Mathematics - Year 6
      {
        subject: "Mathematics",
        topic: "Basic Arithmetic",
        question_text: "What is 15 + 27?",
        correct_answer: "42",
        explanation: "Add the numbers: 15 + 27 = 42",
        difficulty: "easy",
        options: ["40", "42", "45", "52"]
      },
      {
        subject: "Mathematics",
        topic: "Multiplication",
        question_text: "What is 8 × 7?",
        correct_answer: "56",
        explanation: "8 multiplied by 7 equals 56",
        difficulty: "easy",
        options: ["48", "54", "56", "63"]
      },
      {
        subject: "Mathematics",
        topic: "Fractions",
        question_text: "What is 1/2 + 1/4?",
        correct_answer: "3/4",
        explanation: "Convert 1/2 to 2/4, then 2/4 + 1/4 = 3/4",
        difficulty: "medium",
        options: ["2/6", "3/4", "1/3", "2/4"]
      },
      {
        subject: "Mathematics",
        topic: "Geometry",
        question_text: "How many sides does a triangle have?",
        correct_answer: "3",
        explanation: "A triangle has 3 sides by definition",
        difficulty: "easy",
        options: ["2", "3", "4", "5"]
      },
      {
        subject: "Mathematics",
        topic: "Division",
        question_text: "What is 36 ÷ 6?",
        correct_answer: "6",
        explanation: "36 divided by 6 equals 6",
        difficulty: "easy",
        options: ["5", "6", "7", "8"]
      },
      // English - Year 6
      {
        subject: "English Language",
        topic: "Grammar",
        question_text: "Which word is a verb: 'The dog runs fast'?",
        correct_answer: "runs",
        explanation: "A verb shows action. 'Runs' is the action word",
        difficulty: "easy",
        options: ["dog", "runs", "fast", "The"]
      },
      {
        subject: "English Language",
        topic: "Spelling",
        question_text: "Which spelling is correct?",
        correct_answer: "beautiful",
        explanation: "The correct spelling is 'beautiful'",
        difficulty: "medium",
        options: ["beautifull", "beautiful", "beutiful", "beatiful"]
      },
      {
        subject: "English Language",
        topic: "Vocabulary",
        question_text: "What does 'happy' mean?",
        correct_answer: "joyful",
        explanation: "Happy means feeling or showing pleasure or contentment",
        difficulty: "easy",
        options: ["sad", "joyful", "angry", "tired"]
      },
      {
        subject: "English Language",
        topic: "Punctuation",
        question_text: "Which sentence is correct?",
        correct_answer: "I like apples.",
        explanation: "Sentences end with a period",
        difficulty: "easy",
        options: ["I like apples", "I like apples.", "i like apples.", "I like apples,"]
      },
      {
        subject: "English Language",
        topic: "Reading",
        question_text: "What is the opposite of 'hot'?",
        correct_answer: "cold",
        explanation: "Cold is the opposite of hot",
        difficulty: "easy",
        options: ["warm", "cool", "cold", "freezing"]
      },
      // Science - Year 6
      {
        subject: "Basic Science",
        topic: "Animals",
        question_text: "What do plants need to grow?",
        correct_answer: "Water, sunlight, and air",
        explanation: "Plants need water, sunlight, and air for photosynthesis",
        difficulty: "easy",
        options: ["Only water", "Water, sunlight, and air", "Only sunlight", "Only soil"]
      },
      {
        subject: "Basic Science",
        topic: "Human Body",
        question_text: "How many fingers do humans have on both hands?",
        correct_answer: "10",
        explanation: "Humans have 5 fingers on each hand, total 10",
        difficulty: "easy",
        options: ["8", "10", "12", "20"]
      },
      {
        subject: "Basic Science",
        topic: "Weather",
        question_text: "What do we call frozen water?",
        correct_answer: "Ice",
        explanation: "When water freezes, it becomes ice",
        difficulty: "easy",
        options: ["Steam", "Ice", "Rain", "Snow"]
      },
      {
        subject: "Basic Science",
        topic: "Plants",
        question_text: "What part of a plant grows underground?",
        correct_answer: "Roots",
        explanation: "Roots grow underground and absorb water and nutrients",
        difficulty: "easy",
        options: ["Leaves", "Flowers", "Roots", "Stem"]
      },
      {
        subject: "Basic Science",
        topic: "Senses",
        question_text: "Which body part do we use to smell?",
        correct_answer: "Nose",
        explanation: "The nose is the organ for smelling",
        difficulty: "easy",
        options: ["Eyes", "Ears", "Nose", "Mouth"]
      },
      // Social Studies - Year 6
      {
        subject: "Social Studies",
        topic: "Geography",
        question_text: "What continent is Nigeria in?",
        correct_answer: "Africa",
        explanation: "Nigeria is located in West Africa",
        difficulty: "easy",
        options: ["Asia", "Africa", "Europe", "America"]
      },
      {
        subject: "Social Studies",
        topic: "Community",
        question_text: "Who helps sick people get better?",
        correct_answer: "Doctor",
        explanation: "Doctors are medical professionals who treat illnesses",
        difficulty: "easy",
        options: ["Teacher", "Doctor", "Farmer", "Driver"]
      },
      {
        subject: "Social Studies",
        topic: "Culture",
        question_text: "What is Nigeria's capital city?",
        correct_answer: "Abuja",
        explanation: "Abuja is the capital city of Nigeria",
        difficulty: "easy",
        options: ["Lagos", "Abuja", "Kano", "Ibadan"]
      },
      {
        subject: "Social Studies",
        topic: "Family",
        question_text: "What do we call our mother's mother?",
        correct_answer: "Grandmother",
        explanation: "Your mother's mother is your grandmother",
        difficulty: "easy",
        options: ["Aunt", "Grandmother", "Sister", "Cousin"]
      },
      {
        subject: "Social Studies",
        topic: "Environment",
        question_text: "What should we do with trash?",
        correct_answer: "Put it in a bin",
        explanation: "Trash should be disposed of properly in bins to keep the environment clean",
        difficulty: "easy",
        options: ["Throw it anywhere", "Put it in a bin", "Leave it on the ground", "Hide it"]
      }
    ];

    // YEAR 9 QUESTIONS (Age 13-14) - More complex, advanced concepts
    const year9Questions = [
      // Mathematics - Year 9
      {
        subject: "Mathematics",
        topic: "Algebra",
        question_text: "Solve for x: 3x - 7 = 14",
        correct_answer: "x = 7",
        explanation: "Add 7 to both sides: 3x = 21, then divide by 3: x = 7",
        difficulty: "medium",
        options: ["x = 5", "x = 7", "x = 9", "x = 11"]
      },
      {
        subject: "Mathematics",
        topic: "Quadratic Equations",
        question_text: "What are the factors of x² - 5x + 6?",
        correct_answer: "(x - 2)(x - 3)",
        explanation: "x² - 5x + 6 = (x - 2)(x - 3) because -2 × -3 = 6 and -2 + (-3) = -5",
        difficulty: "hard",
        options: ["(x - 1)(x - 6)", "(x - 2)(x - 3)", "(x + 2)(x + 3)", "(x - 6)(x - 1)"]
      },
      {
        subject: "Mathematics",
        topic: "Geometry",
        question_text: "What is the area of a circle with radius 7cm? (Use π = 22/7)",
        correct_answer: "154 cm²",
        explanation: "Area = πr² = (22/7) × 7² = (22/7) × 49 = 154 cm²",
        difficulty: "medium",
        options: ["44 cm²", "98 cm²", "154 cm²", "308 cm²"]
      },
      {
        subject: "Mathematics",
        topic: "Percentages",
        question_text: "If a shirt costs ₦2000 and is discounted by 15%, what is the new price?",
        correct_answer: "₦1700",
        explanation: "15% of ₦2000 = ₦300. New price = ₦2000 - ₦300 = ₦1700",
        difficulty: "medium",
        options: ["₦1500", "₦1700", "₦1800", "₦1850"]
      },
      {
        subject: "Mathematics",
        topic: "Ratios",
        question_text: "If the ratio of boys to girls is 3:2 and there are 15 boys, how many girls are there?",
        correct_answer: "10",
        explanation: "3:2 means for every 3 boys there are 2 girls. 15÷3=5, so 5×2=10 girls",
        difficulty: "medium",
        options: ["8", "10", "12", "15"]
      },
      // English - Year 9
      {
        subject: "English Language",
        topic: "Literary Devices",
        question_text: "What literary device is used in 'The classroom was a zoo'?",
        correct_answer: "Metaphor",
        explanation: "A metaphor directly compares two things without using 'like' or 'as'",
        difficulty: "medium",
        options: ["Simile", "Metaphor", "Personification", "Alliteration"]
      },
      {
        subject: "English Language",
        topic: "Grammar",
        question_text: "Identify the adverb in: 'She quickly finished her homework'",
        correct_answer: "quickly",
        explanation: "An adverb modifies a verb. 'Quickly' describes how she finished",
        difficulty: "medium",
        options: ["She", "quickly", "finished", "homework"]
      },
      {
        subject: "English Language",
        topic: "Comprehension",
        question_text: "What is the meaning of 'procrastinate'?",
        correct_answer: "To delay or postpone",
        explanation: "Procrastinate means to put off doing something",
        difficulty: "medium",
        options: ["To hurry", "To delay or postpone", "To complete", "To cancel"]
      },
      {
        subject: "English Language",
        topic: "Composition",
        question_text: "Which sentence uses correct subject-verb agreement?",
        correct_answer: "The team is practicing",
        explanation: "Collective nouns like 'team' take singular verbs",
        difficulty: "hard",
        options: ["The team are practicing", "The team is practicing", "The teams is practicing", "The team be practicing"]
      },
      {
        subject: "English Language",
        topic: "Vocabulary",
        question_text: "What does 'ambiguous' mean?",
        correct_answer: "Having multiple meanings",
        explanation: "Ambiguous means unclear or having more than one possible interpretation",
        difficulty: "hard",
        options: ["Very clear", "Having multiple meanings", "Impossible", "Easy to understand"]
      },
      // Science - Year 9
      {
        subject: "Basic Science",
        topic: "Chemistry",
        question_text: "What is the chemical formula for carbon dioxide?",
        correct_answer: "CO₂",
        explanation: "Carbon dioxide has one carbon atom and two oxygen atoms",
        difficulty: "medium",
        options: ["CO", "CO₂", "C₂O", "O₂"]
      },
      {
        subject: "Basic Science",
        topic: "Biology",
        question_text: "What is the powerhouse of the cell?",
        correct_answer: "Mitochondria",
        explanation: "Mitochondria produce energy (ATP) for the cell",
        difficulty: "medium",
        options: ["Nucleus", "Mitochondria", "Ribosome", "Chloroplast"]
      },
      {
        subject: "Basic Science",
        topic: "Physics",
        question_text: "What is the unit of force?",
        correct_answer: "Newton",
        explanation: "Force is measured in Newtons (N), named after Isaac Newton",
        difficulty: "medium",
        options: ["Joule", "Newton", "Watt", "Pascal"]
      },
      {
        subject: "Basic Science",
        topic: "Ecology",
        question_text: "What do we call organisms that make their own food?",
        correct_answer: "Producers",
        explanation: "Producers (like plants) create their own food through photosynthesis",
        difficulty: "medium",
        options: ["Consumers", "Producers", "Decomposers", "Predators"]
      },
      {
        subject: "Basic Science",
        topic: "Human Biology",
        question_text: "What type of blood cells fight infection?",
        correct_answer: "White blood cells",
        explanation: "White blood cells (leukocytes) defend the body against disease",
        difficulty: "medium",
        options: ["Red blood cells", "White blood cells", "Platelets", "Plasma"]
      },
      // Social Studies - Year 9
      {
        subject: "Social Studies",
        topic: "History",
        question_text: "Who was Nigeria's first president?",
        correct_answer: "Nnamdi Azikiwe",
        explanation: "Dr. Nnamdi Azikiwe was Nigeria's first president from 1963-1966",
        difficulty: "medium",
        options: ["Obafemi Awolowo", "Nnamdi Azikiwe", "Ahmadu Bello", "Tafawa Balewa"]
      },
      {
        subject: "Social Studies",
        topic: "Government",
        question_text: "How many arms of government does Nigeria have?",
        correct_answer: "Three",
        explanation: "Nigeria has Executive, Legislative, and Judicial arms of government",
        difficulty: "medium",
        options: ["Two", "Three", "Four", "Five"]
      },
      {
        subject: "Social Studies",
        topic: "Economics",
        question_text: "What is inflation?",
        correct_answer: "General increase in prices",
        explanation: "Inflation is when prices of goods and services rise over time",
        difficulty: "hard",
        options: ["Decrease in prices", "General increase in prices", "Stable prices", "Currency value"]
      },
      {
        subject: "Social Studies",
        topic: "Geography",
        question_text: "What is the longest river in Africa?",
        correct_answer: "River Nile",
        explanation: "The Nile River is approximately 6,650 km long",
        difficulty: "medium",
        options: ["River Niger", "River Congo", "River Nile", "River Zambezi"]
      },
      {
        subject: "Social Studies",
        topic: "Citizenship",
        question_text: "At what age can a Nigerian citizen vote?",
        correct_answer: "18 years",
        explanation: "Nigerian citizens can vote at age 18 and above",
        difficulty: "easy",
        options: ["16 years", "18 years", "21 years", "25 years"]
      }
    ];

    // Insert questions and options for Year 6
    console.log('Inserting Year 6 questions...');
    for (const q of year6Questions) {
      const { options, ...questionData } = q;
      
      // Insert question
      const { data: question, error: questionError } = await supabase
        .from('quiz_questions_year6')
        .insert(questionData)
        .select()
        .single();

      if (questionError) {
        console.error('Error inserting Year 6 question:', questionError);
        continue;
      }

      // Insert options
      const optionsData = options.map((option, index) => ({
        question_id: question.id,
        option_text: option,
        is_correct: option === questionData.correct_answer,
        display_order: index
      }));

      const { error: optionsError } = await supabase
        .from('quiz_options_year6')
        .insert(optionsData);

      if (optionsError) {
        console.error('Error inserting Year 6 options:', optionsError);
      }
    }

    // Insert questions and options for Year 9
    console.log('Inserting Year 9 questions...');
    for (const q of year9Questions) {
      const { options, ...questionData } = q;
      
      // Insert question
      const { data: question, error: questionError } = await supabase
        .from('quiz_questions_year9')
        .insert(questionData)
        .select()
        .single();

      if (questionError) {
        console.error('Error inserting Year 9 question:', questionError);
        continue;
      }

      // Insert options
      const optionsData = options.map((option, index) => ({
        question_id: question.id,
        option_text: option,
        is_correct: option === questionData.correct_answer,
        display_order: index
      }));

      const { error: optionsError } = await supabase
        .from('quiz_options_year9')
        .insert(optionsData);

      if (optionsError) {
        console.error('Error inserting Year 9 options:', optionsError);
      }
    }

    console.log('Quiz data populated successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Quiz data populated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
