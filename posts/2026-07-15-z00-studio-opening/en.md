Since mid-2025, I have been using AI tools heavily to help me write code. Over the year that followed, AI coding tools kept evolving. By now, my workflow is largely automated. As the time spent thinking gradually expanded, the idea of doing a side project began to take root in me. A side project used to be a rather low-value way to spend my free time, but recently I have started to see it differently.

## The idea

A few months ago, I briefly used GitHub Copilot to run a very small project, codenamed Morgen, which mainly generated German-learning content and produced teaching podcasts that it automatically uploaded to the major platforms. After years of coasting at an American tech company I had long grown rusty with the tools of the outside world, and this little AI-led project walked me through every major component of an automation project, lowering the "high bar" I had always expected a side project to demand.

Once the bar drops, a person dares to dream big. My idea is to build a fully automated company: one that absorbs all kinds of ideas from me on its own, and puts them into practice automatically. From design and ideation to implementation, testing, and release, all the way to collecting feedback and analyzing the data, the entire pipeline is completed by AI. What the founder (me) has to do is write a great many documents, review documents, delegate authority to the employees, and bravely pull out my credit card and swipe it.

## The structure

The company has a flat structure. The founder (me) directly manages two departments: Orca and Dolphin. Orca is something like a CEO — it holds the highest authority short of the founder's, can authorize each department to carry out its business, and signs off on the emergencies each department "escalates". Orca is also the only department that runs as a daemon, listening on the server for the latest developments at all times. Dolphin holds nearly the smallest set of permissions in the whole company, and can handle most information only in a "read-only" fashion. But Dolphin has one very special privilege, called minority-report. It can bypass Orca and report unusual situations to me through a covert channel. So far I have not received any such report — I hope my employees are not fighting.

Besides these two departments, I also have Elephant for company infrastructure, Leopard for product, Tortoise for documentation, and so on. I will not introduce them one by one here. Every department answers to Orca alone, and when an assigned task cannot be completed, they report the situation to the company through GitHub Issues; a listener process sends every new issue it picks up back into Orca's hands, and Orca then decides, based on the situation at hand, whether to exercise its own authority to help that department carry the matter through. Remarkably, over the past few days of operation, I have already watched Orca raise its own permissions a few times to finish work proactively, and also politely decline a department's request.

## Full automation

There is plenty in this idea to be skeptical about — for example (and probably most importantly) product quality. Personally, though, I believe the models you can subscribe to cheaply today are already powerful enough to handle all kinds of "one-shot" tasks perfectly. So whether these AI tools can effectively handle a large project really comes down to the following:

- Problem decomposition
- Training loops
- Full automation
- Checks and balances

Of these, effective problem decomposition breaks a problem down to a size AI can solve perfectly in "one shot". When multiple "one-shot" problems stack together, the solution starts to drift from the heart of the problem — at that point, bringing in an uninvolved, objective AI to evaluate the work forms a feedback mechanism much like the "feedback" of classical machine learning, realizing the training loop; add perfect automation on top of that, and you can fill up all the hours a human cannot spend focused on work, boosting efficiency enormously.

Worth mentioning: the checks and balances here are somewhat like the design of Z00 Studio itself. The thought grew out of the concept of generative adversarial networks. Limit the power each agent controls and its visibility into the overall project, give different agents their own distinct goals, and let those differing goals hold the agents in mutual check, so that together they advance the company's overall goal — that is the core of the idea. Think about it carefully, and it is really a miniature of our society.

> Is Z00 Studio fully automated already?

Yes — and it took me only three days.

## The blog

I plan to publish my thoughts here, on no particular schedule. They may include glimpses of how the company operates, or observations from using AI tools. I hope I can build a lasting habit of writing.

![Z00 Studio's first game demo, SkeeterShot.](img/skeetershot-demo.png)

![The improvement I saw within ten minutes of opening a GitHub issue complaining about how crude the game was.](img/skeetershot-improved.png)
