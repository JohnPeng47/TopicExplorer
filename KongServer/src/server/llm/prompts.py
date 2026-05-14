GEN_ESSAY_FROM_TREE = """
Given the following context:
{context}

Generate an essay using the following tree as a structural guide
{tree}
"""

GEN_ESSAY_ROOT_TREE = """
Given the following background context, complete the task:
BACKGROUND CONTEXT:
{context}

TASK:
Given the context above, generate a tree diagram that represents the structural component of an essay on the context. 

TREE:
The tree should be generated such that each subsequent lower level features more
topics than the one above it Each sublevel should be ranked in order of
importance to the parent top-level topic
Node Types:
There are going to be 3 different kind of nodes in this tree. 
1. SECTION: indicates a group of paragraphs, under a common theme
2. PARAGRAPH: indicates a paragraph in final essay
3. CONTENT: indicates the content of the paragraph

Output:
Should look like
> SECTION: Introduction to the War of the Orders
--> PARAGRAPH: Background of the Conflict
----> CONTENT: Overview of Roman society pre-conflict
----> CONTENT: Key figures and classes involved
"""

GEN_PARAGRAPH_FROM_TREE = """
You are given a tree, generate a Wikipedia entry for it

Here is the framing context. One sentence should be generated to connect the main content
to the context:
{ancestor_context}

Here is the topic for the main content. Dedicate most of the paragraph to this:
{main_topic}

Here are some requirements:
- Dense Facts: Should contain explicit references to maximum facts
- Terse: Prose terse
- No Section headings
- Generated entry should be in the style of wikipedia                        
Now go generate it:
"""

GEN_PARAGRAPH_FROM_TREEV2 = """
You are given a tree, generate a short, single sentence, research note about it

Here is the framing context. One sentence should be generated to connect the main content
to the context:
{ancestor_context}

Here is the topic for the main content. Dedicate most of the paragraph to this:
{main_topic}

Here are some requirements:
- Dense Facts: Should contain explicit references to maximum facts
- Terse: Prose terse
- No Section headings
- Generated entry should be in the style of wikipedia                        
Now go generate it:
"""

SUBTREE_V3 = """
Given the following background context, complete the task:
BACKGROUND CONTEXT:
{context}

TASK:
Your task is expand on the following subtree. Here are some requirements:
- generate 3 new levels (child nodes) for each node in the SUBTREE nodes
- use the ANCESTOR nodes as context but do not generate any new levels for it 
- never change the root of the SUBTOPIC nodes
- only give your output in terms of the generated subtree
- ALWAYS start your output with "[0]"
- DO NOT REPEAT TOPICS ALREADY MENTIONED
For example, given below:
ANCESTORS
--------
[0] Russia's situation leading up to the Great War
[1] Social unrest
SUBTREE
--------
[0] Role of the intellectual elite
[1] Advocacy for political reform

The new output would be:
[0] Role of the intellectual elite
[1] Advocacy for political reform
[2] Creation of liberal publications and newspapers
[3] Disseminating propaganda among workers and peasants
[3] Promoting political awareness and activism

{llm_instr}

Here is the ANCESTOR context:
{ancestor_tree}
======================

Here is the subtree. Focus generation on subtree, but frame it in the context of the ancestor context:
{subtree}
"""

#### Expansion Rules ####

SECTION_EXPANSION_RULE = """
SECTIONS can hold multiple PARAGRAPHS, not recursively
--> SECTION:
----> PARAGRAPH
----> PARAGRAPH
"""

PARAGRAPH_EXPANSION_RULE = """
PARAGRAPHS can hold multiple CONTENT, not recursively
--> PARAGRAPH:
----> CONTENT
----> CONTENT
"""

CONTENT_EXPANSION_RULE = """
Expand the last NODE of the given subtree, by using the following rule for its
expansion:
CONTENT can hold multiple CONTENT, recursively. For example:
--> CONTENT: Mongol tactics
----> CONTENT: Mastery of Cavalry Tactics
------> CONTENT: Superior horse archery techniques
------> CONTENT: Utilization of rapid maneuvering and feigned retreats
----> CONTENT: Siegecraft and Psychological Warfare
"""

SINGLE_NODE_EXPANSION = """
Expand the last NODE of the given subtree, by applying the following expansion rules to respective nodes of that type:
{rule}

Add 3 sublevels to each node type, according to the rules laid out above

The context of the subtree is:
{context}

Subtree:
{subtree}
"""