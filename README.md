A novel UI for exploring nested topics using LLMs to generate deeply nested "concept" trees

Expand the tree conditioned on the previous branches
![image](https://github.com/user-attachments/assets/22ab6103-14eb-4fc8-af9a-587ea9e494be)

Edit branches to guide generation

![image](https://github.com/user-attachments/assets/f90608ac-287a-4b77-8624-28a4dc1da581)

The main novelty here is that generating tree branches is done through a single prompt and using its ancestor branches as context
```
SUBTREE_V2 = """
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

Here is the subtree:
{subtree}
======================
"""
```
